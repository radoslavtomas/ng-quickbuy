import type {
  JourneyAnswers,
  JourneyPayloadMapper,
} from '../../../core/models/journey-payload.model';

/**
 * Internal name of the policy start date.
 *
 * The partial-store endpoint requires this value on every call, so the persistence
 * service needs to find it among the answers. Naming it here keeps that knowledge
 * with the mapper rather than spreading a field name through services.
 */
export const POLICY_START_DATE_FIELD = 'startDate';

/**
 * Wire slot every person's answers are filed under.
 *
 * The APIs identify people by slot rather than by index: the customer is always
 * `proposer`, and further people occupy named slots. This is why the existing keys
 * read `proposer-name-forenames` — the prefix was always a slot.
 */
export const PROPOSER_SLOT = 'proposer';

/** Slots a motor policy may name, the first being the customer themselves. */
export const MOTOR_DRIVER_SLOTS: readonly string[] = [
  PROPOSER_SLOT,
  'driver-2',
  'driver-3',
  'driver-4',
];

/** Slots a property policy may name for proposers. */
export const PROPERTY_PROPOSER_SLOTS: readonly string[] = [PROPOSER_SLOT, 'jointproposer'];

/**
 * Slots available for people other than the customer.
 *
 * Derived rather than written out, so the ceiling can never disagree with the
 * allowed slots: four driver slots means three *additional* drivers.
 */
export const ADDITIONAL_DRIVER_SLOTS: readonly string[] = MOTOR_DRIVER_SLOTS.slice(1);

/**
 * Insurer key suffix for each field a person has.
 *
 * Combined with a slot to make the full key, so the same field definition serves the
 * proposer and any additional driver.
 */
const PERSON_KEY_SUFFIXES: Readonly<Record<string, string>> = {
  forenames: 'name-forenames',
  surname: 'name-surname',
  dateOfBirth: 'dateofbirth',
  email: 'email',
  phone: 'daytimetelephone',
  addressLine1: 'address-addressline1',
  addressLine2: 'address-addressline2',
  addressLine3: 'address-addressline3',
  addressLine4: 'address-addressline4',
  postcode: 'address-postcode',
  // TODO: confirm wire key names with backend
  employmentStatus: 'employmentstatus',
  occupationCode: 'occupationcode',
  industryCode: 'industrycode',
  ptEmploymentStatus: 'pt-employmentstatus',
  ptOccupationCode: 'pt-occupationcode',
  ptIndustryCode: 'pt-industrycode',
};

/**
 * Answers that exist only to help the customer answer, and never leave the browser.
 *
 * A search field holds a code and the wording that goes with it so the customer can
 * recognise their choice; the insurer wants the code alone, and it arrives through
 * the derived `occupationCode`. Without this list the wording would be posted under
 * its internal name, because the mapper falls back to that for unmapped keys.
 */
const UI_ONLY_FIELDS: ReadonlySet<string> = new Set([
  'occupation',
  'industry',
  'occupationFte',
  'hasParttime',
  'ptOccupation',
  'ptIndustry',
  'ptOccupationFte',
  'houseNameNumber',
]);

/** Keys that belong to the policy rather than to a person. */
const SHARED_POLICY_KEYS: Readonly<Record<string, string>> = {
  startDate: 'policy-inceptiondate',
  voluntaryExcess: 'policy-volxs',
};

const MOTOR_KEYS: Readonly<Record<string, string>> = {
  ...SHARED_POLICY_KEYS,
  registration: 'vehicle-regnumber',
  annualMileage: 'policy-totalmileage',
  overnightLocation: 'vehicle-wherekept',
  coverType: 'policy-cover',
  noClaimsBonusYears: 'policy-previousinsurance-noclaimsbonusyears',
};

const PROPERTY_KEYS: Readonly<Record<string, string>> = {
  ...SHARED_POLICY_KEYS,
};

/** Coded values the backend uses, by internal field name. */
const MOTOR_CODED_VALUES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  coverType: { comprehensive: 'C', tpft: 'TPFT', tpo: 'TPO' },
  overnightLocation: { garage: 'G', driveway: 'D', roadside: 'R' },
};

function toWireValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value ? 'Y' : 'N';
  }

  // An object has no sensible string form, and `[object Object]` on a quote is
  // worse than a missing key: it would be stored and never questioned. Anything
  // structured must reach the wire through a mapped or derived scalar instead.
  if (typeof value === 'object') {
    return null;
  }

  return `${value}`;
}

interface MapperConfig {
  readonly version: string;
  readonly keys: Readonly<Record<string, string>>;
  readonly codedValues: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** Slots this product may file people under, the first being the proposer. */
  readonly personSlots: readonly string[];
  /** Wire slots for each repeat section's items, by section id. */
  readonly repeatSlots: Readonly<Record<string, readonly string[]>>;
  /**
   * Sections whose person answers belong to somebody other than the customer.
   *
   * The joint proposer answers the same questions under the same field names, so
   * without this their surname would overwrite the customer's own.
   */
  readonly sectionSlots?: Readonly<Record<string, string>>;
}

/**
 * A mapper that knows one product's wire format.
 *
 * Both directions are derived from a single name map, so a key can never be right
 * outbound and wrong inbound.
 */
function createMapper({
  version,
  keys,
  codedValues,
  personSlots,
  repeatSlots,
  sectionSlots = {},
}: MapperConfig): JourneyPayloadMapper {
  const backendKeyForSlot = (slot: string, internalName: string): string => {
    const personSuffix = PERSON_KEY_SUFFIXES[internalName];
    if (personSuffix) {
      return `${slot}-${personSuffix}`;
    }

    // A non-person field asked of a specific person is still filed under that slot.
    return slot === PROPOSER_SLOT
      ? (keys[internalName] ?? internalName)
      : `${slot}-${internalName}`;
  };

  const backendKeyFor = (internalName: string): string =>
    backendKeyForSlot(PROPOSER_SLOT, internalName);

  // Reverse lookup covers policy keys plus every person key in every slot, so
  // hydration can recognise a second driver's answers as readily as the proposer's.
  const internalByBackendKey = new Map<string, string>(
    Object.entries(keys).map(([internal, key]) => [key, internal]),
  );
  for (const slot of personSlots) {
    for (const internal of Object.keys(PERSON_KEY_SUFFIXES)) {
      internalByBackendKey.set(backendKeyForSlot(slot, internal), internal);
    }
  }

  const toWireValueFor = (internalName: string, value: unknown): string | null => {
    const codes = codedValues[internalName];
    if (codes && typeof value === 'string' && codes[value] !== undefined) {
      return codes[value];
    }

    return toWireValue(value);
  };

  /**
   * Only a person's own answers move to their slot. A question such as "is there a
   * joint proposer?" is about the policy, not about them, and stays where the
   * product's key map puts it.
   */
  const keyForSection = (sectionId: string, internalName: string): string => {
    const sectionSlot = sectionSlots[sectionId];
    return sectionSlot && PERSON_KEY_SUFFIXES[internalName]
      ? backendKeyForSlot(sectionSlot, internalName)
      : backendKeyFor(internalName);
  };

  return {
    version,
    personSlots,
    backendKeyFor,
    backendKeyForSlot,
    toWireValueFor,

    backendKeyForSection: keyForSection,

    internalNameFor(backendKey: string): string {
      return internalByBackendKey.get(backendKey) ?? backendKey;
    },

    fromWireValueFor(internalName: string, value: unknown): unknown {
      const codes = codedValues[internalName];
      if (!codes || typeof value !== 'string') {
        return value;
      }

      const internalValue = Object.entries(codes).find(([, code]) => code === value)?.[0];
      return internalValue ?? value;
    },

    toStoreFields(answers: JourneyAnswers): Record<string, string> {
      const fields: Record<string, string> = {};

      const write = (key: string, internalName: string, value: unknown): void => {
        if (UI_ONLY_FIELDS.has(internalName)) {
          return;
        }

        const wireValue = toWireValueFor(internalName, value);
        if (wireValue !== null) {
          fields[key] = wireValue;
        }
      };

      for (const sections of Object.values(answers)) {
        for (const [sectionId, values] of Object.entries(sections)) {
          const slots = repeatSlots[sectionId];
          const items = values['items'];

          if (slots && Array.isArray(items)) {
            // Slots come from position, so a removed item re-packs the rest. Items
            // beyond the available slots are dropped rather than silently merged.
            items.slice(0, slots.length).forEach((item, index) => {
              const slot = slots[index];
              for (const [internalName, value] of Object.entries(
                item as Record<string, unknown>,
              )) {
                write(backendKeyForSlot(slot, internalName), internalName, value);
              }
            });
            continue;
          }

          for (const [internalName, value] of Object.entries(values)) {
            write(keyForSection(sectionId, internalName), internalName, value);
          }
        }
      }

      return fields;
    },
  };
}

/** Section id of the motor journey's additional drivers list. */
export const ADDITIONAL_DRIVERS_SECTION_ID = 'additionalDrivers';

export const MOTOR_PAYLOAD_MAPPER = createMapper({
  version: 'motor-1',
  keys: MOTOR_KEYS,
  codedValues: MOTOR_CODED_VALUES,
  personSlots: MOTOR_DRIVER_SLOTS,
  repeatSlots: { [ADDITIONAL_DRIVERS_SECTION_ID]: ADDITIONAL_DRIVER_SLOTS },
});

/** Section id of the property journey's joint proposer questions. */
export const JOINT_PROPOSER_SECTION_ID = 'jointProposer';

export const PROPERTY_PAYLOAD_MAPPER = createMapper({
  version: 'property-1',
  keys: PROPERTY_KEYS,
  codedValues: {},
  personSlots: PROPERTY_PROPOSER_SLOTS,
  repeatSlots: {},
  sectionSlots: { [JOINT_PROPOSER_SECTION_ID]: 'jointproposer' },
});
