import createRequest from "./createRequest";

export default class Entity {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async list() {
    return createRequest({ url: this.baseUrl });
  }

  async get(id) {
    return createRequest({ url: `${this.baseUrl}/${id}` });
  }

  async create(data) {
    return createRequest({
      url: this.baseUrl,
      method: "POST",
      body: data,
    });
  }

  async update(id, data) {
    return createRequest({
      url: `${this.baseUrl}/${id}`,
      method: "PUT",
      body: data,
    });
  }

  async delete(id) {
    return createRequest({
      url: `${this.baseUrl}/${id}`,
      method: "DELETE",
    });
  }
}
