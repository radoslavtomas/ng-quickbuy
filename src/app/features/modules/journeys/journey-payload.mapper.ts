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
 * Names the insurer APIs use, keyed by the internal name.
 *
 * Anything absent is sent under its internal name, which is the honest default: we
 * only claim a translation where the backend key is actually known. The address keys
 * are shared by both products because the proposer address is the same concept.
 */
const SHARED_KEYS: Readonly<Record<string, string>> = {
  forenames: 'proposer-name-forenames',
  surname: 'proposer-name-surname',
  dateOfBirth: 'proposer-dateofbirth',
  email: 'proposer-email',
  phone: 'proposer-daytimetelephone',
  addressLine1: 'proposer-address-addressline1',
  addressLine2: 'proposer-address-addressline2',
  addressLine3: 'proposer-address-addressline3',
  addressLine4: 'proposer-address-addressline4',
  postcode: 'proposer-address-postcode',
  startDate: 'policy-inceptiondate',
  voluntaryExcess: 'policy-volxs',
};

const MOTOR_KEYS: Readonly<Record<string, string>> = {
  ...SHARED_KEYS,
  registration: 'vehicle-regnumber',
  annualMileage: 'policy-totalmileage',
  overnightLocation: 'vehicle-wherekept',
  coverType: 'policy-cover',
  noClaimsBonusYears: 'policy-previousinsurance-noclaimsbonusyears',
};

const PROPERTY_KEYS: Readonly<Record<string, string>> = {
  ...SHARED_KEYS,
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
}

/**
 * A mapper that knows one product's wire format.
 *
 * Both directions are derived from a single name map, so a key can never be right
 * outbound and wrong inbound.
 */
function createMapper({ version, keys, codedValues }: MapperConfig): JourneyPayloadMapper {
  const internalByBackendKey = new Map(
    Object.entries(keys).map(([internal, key]) => [key, internal]),
  );

  const backendKeyFor = (internalName: string): string => keys[internalName] ?? internalName;

  const toWireValueFor = (internalName: string, value: unknown): string | null => {
    const codes = codedValues[internalName];
    if (codes && typeof value === 'string' && codes[value] !== undefined) {
      return codes[value];
    }

    return toWireValue(value);
  };

  return {
    version,
    backendKeyFor,
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
});

export const PROPERTY_PAYLOAD_MAPPER = createMapper({
  version: 'property-1',
  keys: PROPERTY_KEYS,
  codedValues: {},
});
