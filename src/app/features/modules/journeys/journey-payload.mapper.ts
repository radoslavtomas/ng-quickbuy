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
};

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

  return `${value}`;
}

interface MapperConfig {
  readonly version: string;
  readonly keys: Readonly<Record<string, string>>;
  readonly codedValues: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** Slots this product may file people under, the first being the proposer. */
  readonly personSlots: readonly string[];
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

  return {
    version,
    personSlots,
    backendKeyFor,
    backendKeyForSlot,
    toWireValueFor,

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

      for (const sections of Object.values(answers)) {
        for (const values of Object.values(sections)) {
          for (const [internalName, value] of Object.entries(values)) {
            const wireValue = toWireValueFor(internalName, value);
            if (wireValue !== null) {
              fields[backendKeyFor(internalName)] = wireValue;
            }
          }
        }
      }

      return fields;
    },
  };
}

export const MOTOR_PAYLOAD_MAPPER = createMapper({
  version: 'motor-1',
  keys: MOTOR_KEYS,
  codedValues: MOTOR_CODED_VALUES,
  personSlots: MOTOR_DRIVER_SLOTS,
});

export const PROPERTY_PAYLOAD_MAPPER = createMapper({
  version: 'property-1',
  keys: PROPERTY_KEYS,
  codedValues: {},
  personSlots: PROPERTY_PROPOSER_SLOTS,
});
