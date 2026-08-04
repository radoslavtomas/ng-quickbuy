import type {
  JourneyAnswers,
  JourneyPayloadMapper,
} from '../../../core/models/journey-payload.model';

/**
 * Serialises one answer for the wire.
 *
 * Booleans become `Y`/`N`, which is what the quote APIs use. Empty values are
 * dropped by the caller rather than sent as blanks.
 */
function toWireValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value ? 'Y' : 'N';
  }

  return `${value}`;
}

/**
 * Builds a mapper that sends each answer under its own field name.
 *
 * Field names currently double as backend keys, so the projection is direct. When
 * field names become internal, this gains an explicit name map per product and the
 * two mappers stop being identical.
 */
function createDirectMapper(version: string): JourneyPayloadMapper {
  return {
    version,

    toStoreFields(answers: JourneyAnswers): Record<string, string> {
      const fields: Record<string, string> = {};

      for (const sections of Object.values(answers)) {
        for (const values of Object.values(sections)) {
          for (const [name, value] of Object.entries(values)) {
            const wireValue = toWireValue(value);
            if (wireValue !== null) {
              fields[name] = wireValue;
            }
          }
        }
      }

      return fields;
    },
  };
}

export const MOTOR_PAYLOAD_MAPPER = createDirectMapper('motor-1');
export const PROPERTY_PAYLOAD_MAPPER = createDirectMapper('property-1');
