import {
  fromVehicleWireAnswers,
  resolveIrisModule,
  toVehicleWireAnswers,
  vehicleFieldKeys,
} from './vehicle-field-map';

describe('vehicleFieldKeys', () => {
  it('uses the default table for a module with no overrides', () => {
    const keys = vehicleFieldKeys('PC');

    expect(keys.regnumber).toBe('vehicle-regnumber');
    expect(keys.fuel).toBe('vehicle-fuel');
    expect(keys.year).toBe('vehicle-yearofmanufacture');
  });

  it('TX shares the default table, since it has no overrides of its own', () => {
    expect(vehicleFieldKeys('TX')).toEqual(vehicleFieldKeys('PC'));
  });

  it('overrides only the fuel key for GV', () => {
    const keys = vehicleFieldKeys('GV');

    expect(keys.fuel).toBe('duqs-question-64');
    expect(keys.regnumber).toBe('vehicle-regnumber');
  });

  it('overrides regnumber and year for BD, leaving the rest at their defaults', () => {
    const keys = vehicleFieldKeys('BD');

    expect(keys.regnumber).toBe('vehicles-vehicle-1-regnumber');
    expect(keys.year).toBe('vehicles-vehicle-1-yearofmanufacture');
    expect(keys.makeandmodel).toBe('vehicles-vehicle-1-makeandmodel');
    expect(keys.engine).toBe('vehicles-vehicle-1-enginecc');
    expect(keys.fuel).toBe('vehicle-fuel');
  });

  it('is case-insensitive on the module code', () => {
    expect(vehicleFieldKeys('bd').regnumber).toBe('vehicles-vehicle-1-regnumber');
  });
});

describe('toVehicleWireAnswers / fromVehicleWireAnswers', () => {
  it('round-trips canonical fields through their wire keys', () => {
    const vehicle = { regnumber: 'AB12CDE', make: 'AUDI', model: 'Q7', year: 2017 };

    const wire = toVehicleWireAnswers('PC', vehicle);
    expect(wire['vehicle-regnumber']).toBe('AB12CDE');
    expect(wire['vehicle-make']).toBe('AUDI');

    expect(fromVehicleWireAnswers('PC', wire)).toEqual(vehicle);
  });

  it('omits fields that are undefined rather than writing them as blank', () => {
    const wire = toVehicleWireAnswers('PC', { make: 'AUDI', model: undefined });

    expect(Object.keys(wire)).toEqual(['vehicle-make']);
  });

  it('applies module overrides in both directions', () => {
    const wire = toVehicleWireAnswers('GV', { fuel: 'P' });
    expect(wire['duqs-question-64']).toBe('P');

    expect(fromVehicleWireAnswers('GV', wire)).toEqual({ fuel: 'P' });
  });

  it('reads BD-shaped answers back out under their canonical names', () => {
    const stored = {
      'vehicles-vehicle-1-regnumber': 'AB12CDE',
      'vehicles-vehicle-1-yearofmanufacture': '2015',
      'vehicles-vehicle-1-makeandmodel': 'Ford Transit',
      'vehicles-vehicle-1-enginecc': 1600,
    };

    expect(fromVehicleWireAnswers('BD', stored)).toEqual({
      regnumber: 'AB12CDE',
      year: '2015',
      makeandmodel: 'Ford Transit',
      engine: 1600,
    });
  });
});

describe('resolveIrisModule', () => {
  it('resolves PC and TX to the PC catalogue', () => {
    expect(resolveIrisModule('PC')).toBe('PC');
    expect(resolveIrisModule('TX')).toBe('PC');
  });

  it('resolves GV to its own catalogue', () => {
    expect(resolveIrisModule('GV')).toBe('GV');
  });

  it('falls back to PC for anything else, including BD which never calls IRIS', () => {
    expect(resolveIrisModule('BD')).toBe('PC');
  });
});
