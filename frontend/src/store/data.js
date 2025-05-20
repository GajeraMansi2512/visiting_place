export const getUser = async (id) => {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`http://localhost:8000/${id}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data;
};
