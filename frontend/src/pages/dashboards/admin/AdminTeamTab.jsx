import React from "react";
import TeamTab from "../owner/TeamTab";

const AdminTeamTab = ({ user, teamList, setTeamList, addLocalInvitation, showToast, clients = [] }) => (
  <TeamTab
    user={user}
    teamList={teamList}
    setTeamList={setTeamList}
    showToast={showToast}
    clients={clients}
  />
);

export default AdminTeamTab;
