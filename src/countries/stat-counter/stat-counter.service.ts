import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class StatCounterService {
  constructor(private prismaService: PrismaService) {}

  async calculateCountryStats() {
    await this.prismaService.prisma.covid_stats_weekly.deleteMany({});

    await this.prismaService.prisma.$executeRaw`
    WITH sbw as (SELECT 
   iso3, 
   date_trunc('week', (cast(date_published as text) || ' 00:00:01')::timestamp at time zone 'UTC') as week, 
   confirmed, 
  people_tested,
  incident_rate,
   testing_rate, 
   hospitalization_rate, 
   deaths, 
   recovered, 
   active
FROM 
   covid_stats
),
 sbw_week AS (SELECT week, iso3,
sum(people_tested) as people_tested,    
sum(recovered) as recovered,
sum(active) as active,
avg(incident_rate) AS incident_rate,
avg(testing_rate) AS testing_rate,
avg(hospitalization_rate) as hospitalization_rate
from sbw
GROUP BY iso3, week
ORDER BY week, iso3)
INSERT INTO covid_stats_weekly (id, week, iso3, people_tested, 
        recovered, active, incident_rate, 
        testing_rate, hospitalization_rate)
        SELECT gen_random_uuid (), week, iso3, people_tested,
        recovered, active, incident_rate, 
        testing_rate, hospitalization_rate
        FROM sbw_week;`;
  }
}
