const NUMERICS = [
  'confirmed',
  'deaths',
  'recovered',
  'tests',
  'vaccines',
  'people_vaccinated',
  'people_fully_vaccinated',
  'hosp',
  'icu',
  'vent',
  'school_closing',
  'workplace_closing',
  'cancel_events',
  'gatherings_restrictions',
  'transport_closing',
  'stay_home_restrictions',
  'internal_movement_restrictions',
  'international_movement_restrictions',
  'information_campaigns',
  'testing_policy',
  'contact_tracing',
  'facial_coverings',
  'vaccination_policy',
  'elderly_people_protection',
  'government_response_index',
  'stringency_index',
  'containment_health_index',
  'economic_support_index',
  'administrative_area_level',
  'latitude',
  'longitude',
  'population',
  'iso_numeric',
];

const STATE_FIELDS = [
  'administrative_area_level',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'latitude',
  'longitude',
  'population',
  'iso_alpha_3',
  'iso_alpha_2',
  'iso_numeric',
  'iso_currency',
  'key_local',
  'key_google_mobility',
  'key_apple_mobility',
  'key_jhu_csse',
  'key_nuts',
  'key_gadm',
];
export default class CovidStateDataDenorm {
  constructor(data) {
    Object.keys(data).forEach((key) => {
      const value = data[key];
      try {
        if (key === 'date') {
          this[key] = new Date(value);
        } else if (NUMERICS.includes(key)) {
          if (value === '') {
            this[key] = 0;
          } else if (/[.]/.test(value)) {
            this[key] = Number.parseFloat(value);
          } else {
            this[key] = Number.parseInt(value, 10);
          }
          if (Number.isNaN(this[key])) {
            this[key] = 0;
          }
        } else {
          this[key] = `${value}`;
        }
      } catch (err) {
        console.log('error writing', key, value, err);
      }
    });

    if (!this.administrative_area_level_2) {
      this.administrative_area_level_2 = 'ROOT';
    }
    if (!this.administrative_area_level_1) {
      this.administrative_area_level_1 = 'ROOT';
    }

    /*    if (Math.random() < 0.0001) {
      console.log('made denorm ', this, 'from data', data);
    }*/
  }

  id: string;
  date: Date;
  confirmed: number | null;
  deaths: number | null;
  recovered: number | null;
  tests: number | null;
  vaccines: number | null;
  people_vaccinated: number | null;
  people_fully_vaccinated: number | null;
  hosp: number | null;
  icu: number | null;
  vent: number | null;
  school_closing: number | null;
  workplace_closing: number | null;
  cancel_events: number | null;
  gatherings_restrictions: number | null;
  transport_closing: number | null;
  stay_home_restrictions: number | null;
  internal_movement_restrictions: number | null;
  international_movement_restrictions: number | null;
  information_campaigns: number | null;
  testing_policy: number | null;
  contact_tracing: number | null;
  facial_coverings: number | null;
  vaccination_policy: number | null;
  elderly_people_protection: number | null;
  government_response_index: number | null;
  stringency_index: number | null;
  containment_health_index: number | null;
  economic_support_index: number | null;
  administrative_area_level: number | null;
  administrative_area_level_1: string | null;
  administrative_area_level_2: string | null;
  administrative_area_level_3: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  iso_alpha_3: string | null;
  iso_alpha_2: string | null;
  iso_numeric: number | null;
  iso_currency: string | null;
  key_local: string | null;
  key_google_mobility: string | null;
  key_apple_mobility: string | null;
  key_jhu_csse: string | null;
  key_nuts: string | null;
  key_gadm: string | null;

  public static toJSON(denorm: CovidStateDataDenorm) {
    const data = { ...denorm };
    STATE_FIELDS.forEach((field) => delete data[field]);
    return data;
  }
  public static toState(denorm: CovidStateDataDenorm) {
    const data = { id: denorm.id };
    STATE_FIELDS.forEach((field) => (data[field] = denorm[field]));
    return data;
  }
}
