import React from "react";
import TeamTab from "../owner/TeamTab";

const AdminTeamTab = ({ teamList, setTeamList, showToast }) => {
  return (
    <TeamTab
      teamList={teamList}
      setTeamList={setTeamList}
      showToast={showToast}
    />
  );
};

export default AdminTeamTab;
