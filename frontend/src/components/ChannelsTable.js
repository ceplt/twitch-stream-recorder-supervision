import React from "react";

const ChannelsTable = ({ channels, type }) => {
  const createTableHeader = () => {
    const headerRow = (
      <tr>
        <th class="th-channel-name">Channel name</th>
        {type === "recording" && <th>Start time</th>}
        {type === "recording" && <th>Duration</th>}
        {type === "recording" && <th>File name</th>}
        {type === "offline" && <th>Last record</th>}
      </tr>
    );
    return <thead>{headerRow}</thead>;
  };

  const createTableRows = () => {
    return channels.map((channel) => {
      const { name, start_time, duration, filename, last_record } = channel;
      const row = (
        <tr key={name}>
          <td>{name}</td>
          {type === "recording" && <td>{start_time}</td>}
          {type === "recording" && <td>{duration}</td>}
          {type === "recording" && <td>{filename}</td>}
          {type === "offline" && <td>{last_record}</td>}
        </tr>
      );
      return row;
    });
  };

  return (
    <table>
      {createTableHeader()}
      <tbody>{createTableRows()}</tbody>
    </table>
  );
};

export default ChannelsTable;
