### Task Count Calculations

This module created to calculate count of tasks thus 
providing important statistics to show in views of vezio.work
or any other client application. 

Calculations process consists of two parts: calculations of current
state from tasks present, and update of state with each create 
or delete task.

We saving data into projects in database.

#### Data format

```javascript
projects
tasksInfo: {
  allUsers: {
    all: Number,
    completed: Number
  },
  individual: [
    {
       userId: String,
       all: Number,
       completed: Number
     }
  ]
}

```



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
