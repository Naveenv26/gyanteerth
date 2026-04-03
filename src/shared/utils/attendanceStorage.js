export const loadAttendance = () => {
  try {
    return JSON.parse(localStorage.getItem("attendance")) || {};
  } catch {
    return {};
  }
};

export const saveAttendance = (data) => {
  localStorage.setItem("attendance", JSON.stringify(data));
};
