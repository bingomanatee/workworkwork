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
  'iso_numeric',
  'latitude',
  'longitude',
  'government_response_index',
  'stringency_index',
  'containment_health_index',
  'economic_support_index',
  'population'
];
export default class CovidDataDenorm {
  id: string | null;
  constructor(data) {
    const { date, iso_alpha_3, id } = data;
    this.date = date;
    this.iso_alpha_3 = iso_alpha_3;
    this.id = `${id}`;
    Object.keys(data).forEach((key) => {
      if (['date', 'id', 'iso_alpha_3'].includes(key)) {
        return;
      }
      if (key in this) {
        const value = data[key];
        if (NUMERICS.includes(key)) {
          if (typeof value === 'number') {
            this[key] = value;
          }
        } else {
          this[key] = value;
        }
      }
    });
  }
  date: Date;
  confirmed: number | null = null;
  deaths: number | null = null;
  recovered: number | null = null;
  tests: number | null = null;
  vaccines: number | null = null;
  people_vaccinated: number | null = null;
  people_fully_vaccinated: number | null = null;
  hosp: number | null = null;
  icu: number | null = null;
  vent: number | null = null;
  school_closing: number | null = null;
  workplace_closing: number | null = null;
  cancel_events: number | null = null;
  gatherings_restrictions: number | null = null;
  transport_closing: number | null = null;
  stay_home_restrictions: number | null = null;
  internal_movement_restrictions: number | null = null;
  international_movement_restrictions: number | null = null;
  information_campaigns: number | null = null;
  testing_policy: number | null = null;
  contact_tracing: number | null = null;
  facial_coverings: number | null = null;
  vaccination_policy: number | null = null;
  elderly_people_protection: number | null = null;
  government_response_index: number | null = null;
  stringency_index: number | null = null;
  containment_health_index: number | null = null;
  economic_support_index: number | null = null;
  administrative_area_level: number | null = null;
  latitude: number | null = null;
  longitude: number | null = null;
  population: number | null = null;
  administrative_area_level_1: string | null = null;
  administrative_area_level_2: string | null = null;
  administrative_area_level_3: string | null = null;
  iso_alpha_3: string;
  iso_alpha_2: string | null = null;
  iso_numeric: number | null = null;
  iso_currency: string | null = null;
  key_local: string | null = null;
  key_google_mobility: string | null = null;
  key_apple_mobility: string | null = null;
  key_jhu_csse: string | null = null;
  key_nuts: string | null = null;
  key_gadm: string | null = null;
}
