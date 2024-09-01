import React, { useState, useEffect } from "react";
import { fetchSupervision } from "./api";
import ChannelsTable from "./ChannelsTable";

function App() {
  const [recordingChannels, setRecordingChannels] = useState([]);
  const [offlineChannels, setOfflineChannels] = useState([]);
  const emptyColumnContent = "-"

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchSupervision();
      if (data) {
        const recording = [];
        const offline = [];

        for (const channel in data) {
          const allRecording = Object.values(data).every(channel => channel.recording === true);
          const allOffline = Object.values(data).every(channel => channel.recording === false);
          
          if (allRecording && !offline.length) {
            offline.push({
              name: emptyColumnContent,
              last_record: emptyColumnContent
            });
          };
          if (allOffline && !recording.length) {
            recording.push({
              name: emptyColumnContent,
              start_time: emptyColumnContent,
              duration: emptyColumnContent,
              filename: emptyColumnContent,
            });
          };
          
          const channelData = data[channel];
          
          if (channelData.recording) {
            recording.push({
              name: channel,
              start_time: channelData.start_time,
              duration: channelData.duration,
              filename: channelData.filename,
            });
          } else {
            offline.push({
              name: channel,
              last_record: channelData.last_record ? channelData.last_record : emptyColumnContent
            });
          }
        }
        setRecordingChannels(recording);
        setOfflineChannels(offline);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 15000); // 15s

    // to prevent memory leaks
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container">
      <h1>Supervision twitch-record</h1>
      <div className="card">
        <div className="card-header">Recording</div>
        <div className="card-content">
          <ChannelsTable channels={recordingChannels} type="recording" />
        </div>
      </div>
      <div className="card">
        <div className="card-header">Offline</div>
        <div className="card-content">
          <ChannelsTable channels={offlineChannels} type="offline" />
        </div>
      </div>
    </div>
  );
}

export default App;
