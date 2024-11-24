import { RESTDataSource } from 'apollo-datasource-rest';

class GithubDatasource extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'https://api.github.com/';
  }

  willSendRequest(request: any) {
    // Set the Authorization header with your GitHub token
    request.headers.set('Authorization', `Bearer ${process.env.GITHUB_TOKEN}`);
  }

  async getRepository(owner: string, name: string) {
    // Fetch a specific repository by owner and name
    return this.get(`repos/${owner}/${name}`);
  }

  async getViewer() {
    // Fetch the authenticated user (viewer)
    return this.get('user');
  }

  async getUserRepos(username: string) {
    // Fetch repositories for a specific user
    return this.get(`users/${username}/repos`);
  }
}

export default GithubDatasource;
