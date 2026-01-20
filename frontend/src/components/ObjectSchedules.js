import React, { useState } from 'react';
import CurrentSchedule from './CurrentSchedule';
import SchedulePreferences from './SchedulePreferences';
import ScheduleHistory from './ScheduleHistory';
import CreateNewSchedule from './CreateNewSchedule';

const ObjectSchedules = ({ token, objectId }) => {
  const [currentTab, setCurrentTab] = useState('current');

  const renderTab = () => {
    switch (currentTab) {
      case 'current':
        return <CurrentSchedule token={token} objectId={objectId} />;
      case 'preferences':
        return <SchedulePreferences token={token} objectId={objectId} />;
      case 'history':
        return <ScheduleHistory token={token} objectId={objectId} />;
      case 'create':
        return <CreateNewSchedule token={token} objectId={objectId} />;
      default:
        return <p>Select a tab</p>;
    }
  };

  return (
    <div>
      <h2>Schedules for Object</h2>
      <nav>
        <button onClick={() => setCurrentTab('current')}>Current Schedule</button>
        <button onClick={() => setCurrentTab('preferences')}>Preferences</button>
        <button onClick={() => setCurrentTab('history')}>History</button>
        <button onClick={() => setCurrentTab('create')}>Create New</button>
      </nav>
      <div>{renderTab()}</div>
    </div>
  );
};

export default ObjectSchedules;
