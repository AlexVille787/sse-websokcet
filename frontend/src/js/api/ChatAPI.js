import Entity from "./Entity";
import createRequest from "./createRequest";

export default class ChatAPI extends Entity {
  constructor(baseUrl) {
    super(baseUrl);
    this.baseUrl = baseUrl;
  }

  async createUser(name) {
    return createRequest({
      url: `${this.baseUrl}/new-user`,
      method: "POST",
      body: { name },
    });
  }
}
