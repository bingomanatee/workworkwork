import * as dayjs from 'dayjs';

function asInt(value) {
  const i = parseInt(value);
  if (isNaN(i)) {
    return 0;
  } else {
    return i;
  }
}

function asFloat(value) {
  if (typeof value === 'number') return value;
  try {
    const i = parseFloat(value);
    if (isNaN(i)) {
      return null;
    }
    return i;
  } catch (err) {
    return null;
  }
}

function asDate(date) {
  const value = dayjs(date);
  if (!value.isValid()) {
    return null;
  }
  return value.toDate();
}

function asString(str) {
  try {
    return `${str}`;
  } catch (err) {
    return '';
  }
}

export const LOCATION_KEYS = [
  'uid',
  'iso2',
  'iso3',
  'code3',
  'latitude',
  'longitude',
  'fips',
  'admin2',
  'province_state',
  'country_region',
  'population',
];

export const KEYS = [
  'id',
  'date_published',
  'uid',
  'iso2',
  'iso3',
  'code3',

  'fips',
  'admin2',
  'province_state',
  'country_region',
  'population',

  'last_update',
  'latitude',
  'longitude',
  'confirmed',
  'deaths',
  'recovered',
  'active',
  'incident_rate',
  'people_tested',
  'people_hospitalized',
  'mortality_rate',
  'testing_rate',
  'hospitalization_rate',
];

export const STAT_KEYS = [
  'id',
  'uid',
  'date_published',
  'last_update',
  'confirmed',
  'deaths',
  'recovered',
  'active',
  'incident_rate',
  'people_tested',
  'people_hospitalized',
  'mortality_rate',
  'testing_rate',
  'hospitalization_rate',
];

export default class CaseRow {
  constructor(data) {
    Object.keys(data).forEach((key) => {
      const lcKey = key.toLowerCase();
      if (KEYS.includes(lcKey)) {
        let term = data[key];
        if (term === 'NA') term = null;
        this[lcKey] = term;
      }
    });
  }

  get case(): CaseRow {
    // @ts-ignore
    return STAT_KEYS.reduce((memo, key) => {
      memo[key] = this[key];
      return memo;
    }, {});
  }
  get location(): CaseRow {
    // @ts-ignore
    return LOCATION_KEYS.reduce((memo, key) => {
      memo[key] = this[key];
      return memo;
    }, {});
  }

  valueOf() {
    return KEYS.reduce((out, name) => {
      out[name] = this[name];
      return out;
    }, {});
  }

  getInsertFields() {
    return KEYS;
  }

  getInsertVariables() {
    return KEYS.map((key) => {
      const value = this[key];
      if (value === null) {
        return 'null';
      }
      if (value instanceof Date) {
        return value.toUTCString();
      }
      switch (typeof value) {
        case 'string':
          return `'${value}'`;
          break;

        case 'number':
          return value;
          break;

        default:
          return value;
      }
    });
  }
}

function defProps(myClass, names, inputFilter, start) {
  names.forEach((name) => {
    const localName = '_' + name;
    const propDef = {
      configurable: false,
      enumerable: true,
      get() {
        if (!(localName in this)) {
          this[localName] = start;
        }
        return this[localName];
      },
      set(value) {
        this[localName] = inputFilter(value);
      },
    };

    Object.defineProperty(myClass.prototype, name, propDef);
    Object.defineProperty(myClass.prototype, localName, {
      enumerable: false,
      writable: true,
    });
  });
}

defProps(
  CaseRow,
  [
    'id',
    'mortality_rate',
    'active',
    'population',
    'people_tested',
    'confirmed',
    'deaths',
    'uid',
    'recovered',
    'people_hospitalized',
  ],
  asInt,
  0,
);

defProps(CaseRow, ['date_published', 'last_update'], asDate, null);
defProps(
  CaseRow,
  [
    'longitude',
    'latitude',
    'incident_rate',
    'testing_rate',
    'hospitalization_rate',
  ],
  asFloat,
  null,
);

defProps(
  CaseRow,
  [
    'iso2',
    'iso3',
    'code3',
    'fips',
    'admin2',
    'province_state',
    'country_region',
  ],
  asString,
  '',
);
