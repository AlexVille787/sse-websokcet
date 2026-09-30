const createRequest = async (options) => {
  const { url, method = "GET", body } = options;

  const params = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    params.body = JSON.stringify(body);
  }

  const response = await fetch(url, params);
  const data = await response.json();

  return { data, status: response.status, ok: response.ok };
};

export default createRequest;
