### Time Entries Calculations

This module created to pre-calculate sums of time counted and money earned
thus providing important statistics to show in views of vezio.work or any
other client application.

Calculations process consists of two parts: calculations of current state
from time entires present, made by Summarizer class, and update of state
with each track stopped or time entry updated, made by updateTrack module.
Also every midnight cron job run, which get all non zero tracks and move
it, according to date ( today become yesterday, thisWeek become lastWeek etc).

We saving data into projects, tasks and contracts documents in database.

#### Data format

```javascript
TrackInfo: {
  tracked: Number,
  earned: Number
}

projects
trackingInfo: {
  allUsers: {
    allTime: TrackInfo,
    lastMonth: TrackInfo,
    thisMonth: TrackInfo,
    lastWeek: TrackInfo,
    thisWeek: TrackInfo,
    yesterday: TrackInfo,
    today: TrackInfo
  },
  individual: [
    {
       userId: String,
       allTime: TrackInfo,
       lastMonth: TrackInfo,
       thisMonth: TrackInfo,
       lastWeek: TrackInfo,
       thisWeek: TrackInfo,
       yesterday: TrackInfo,
       today: TrackInfo
     }
  ]
}

tasks
trackingInfo: {
  allUsers: {
    allTime: TrackInfo,
    lastMonth: TrackInfo,
    thisMonth: TrackInfo,
    lastWeek: TrackInfo,
    thisWeek: TrackInfo,
    yesterday: TrackInfo,
    today: TrackInfo
  },
  individual: [
    {
      userId: String,
      allTime: TrackInfo,
      lastMonth: TrackInfo,
      thisMonth: TrackInfo,
      lastWeek: TrackInfo,
      thisWeek: TrackInfo,
      yesterday: TrackInfo,
      today: TrackInfo
    }
  ]
}

contracts
trackingInfo: {
  allTime: [
    {
      projectId: String,
      tracked: Number,
      earned: Number
    }
  ]
}
```

#### Summarizer class

This class calculates actual info from timeEntries, passing through all projects,
tasks and users, but omiting to calculate zero results, if allTime for allUsers
already showed such, and not calculating for blocked and archived users.

Because of amount of calculations performed this class should be called rarely,
ideally only once.

Results saved into projects, tasks and contracts, in format showed above. If you need
to check how much time needed for calculations uncomment lines containing SummarizerTimer.

#### Update track module

This module main function called on stop tracking and on every timeEntries update function.
Addition made in given project, task and contract for allUsers and individual tracks.

#### Cron update of track period

Period mover module main function called every midnight, it fisrt determine wich periods
need to be moved, then finds projects and tasks with positive tracks and update them.

#### Testing

To run tests use following command:

```sh
meteor npm run test
```
During test development use command:

```sh
meteor npm run test-watch
```

#### Additional notes

Made by Vezio Team, September 2017
