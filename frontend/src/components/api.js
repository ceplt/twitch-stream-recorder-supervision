export const fetchSupervision = async () => {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";
  try {
    const response = await fetch(`${apiUrl}/supervision`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des infos de supervision:", error);
    return null;
  }
};