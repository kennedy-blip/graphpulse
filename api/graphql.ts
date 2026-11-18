import { buildSchema, graphql, type GraphQLFieldResolver, type GraphQLObjectType } from 'graphql';

const sdl = `
  type User { id: ID!, name: String!, email: String!, role: String!, avatar: String }
  type Project { id: ID!, name: String!, description: String!, status: String!, repository: String!, stars: Int!, owner: User!, deployments: [Deployment!]! }
  type Deployment { id: ID!, environment: String!, status: String!, url: String!, commit: String!, createdAt: String!, duration: Int!, project: Project! }
  type Log { id: ID!, level: String!, message: String!, timestamp: String!, source: String! }
  type Query {
    users: [User!]!
    user(id: ID!): User
    projects: [Project!]!
    project(id: ID!): Project
    deployments: [Deployment!]!
    logs(level: String): [Log!]!
    health: String!
  }
  type Mutation {
    createProject(name: String!, description: String!): Project!
    triggerDeployment(projectId: ID!, environment: String!): Deployment!
  }
`;

const schema = buildSchema(sdl);
const users = [
  { id: 'usr_01', name: 'Alex Morgan', email: 'alex@graphpulse.dev', role: 'Owner', avatar: 'AM' },
  { id: 'usr_02', name: 'Sam Rivera', email: 'sam@graphpulse.dev', role: 'Developer', avatar: 'SR' },
  { id: 'usr_03', name: 'Jordan Lee', email: 'jordan@graphpulse.dev', role: 'Admin', avatar: 'JL' }
];
const projects: any[] = [
  { id: 'prj_01', name: 'commerce-api', description: 'Core commerce GraphQL gateway', status: 'healthy', repository: 'acme/commerce-api', stars: 248, ownerId: 'usr_01' },
  { id: 'prj_02', name: 'identity-service', description: 'Authentication and identity graph', status: 'healthy', repository: 'acme/identity-service', stars: 182, ownerId: 'usr_02' },
  { id: 'prj_03', name: 'analytics-engine', description: 'Event ingestion and reporting API', status: 'degraded', repository: 'acme/analytics-engine', stars: 96, ownerId: 'usr_03' }
];
const deployments: any[] = [
  { id: 'dep_1042', projectId: 'prj_01', environment: 'production', status: 'ready', url: 'commerce-api.acme.dev', commit: 'a83f9c2', createdAt: '2026-11-18T06:42:00Z', duration: 1280 },
  { id: 'dep_1041', projectId: 'prj_02', environment: 'production', status: 'ready', url: 'identity.acme.dev', commit: 'c91b2d4', createdAt: '2026-11-18T06:18:00Z', duration: 940 },
  { id: 'dep_1040', projectId: 'prj_03', environment: 'staging', status: 'building', url: 'analytics-staging.acme.dev', commit: 'e42a1b8', createdAt: '2026-11-18T05:57:00Z', duration: 0 }
];
const logs = [
  { id: 'log_01', level: 'INFO', message: 'Schema cache refreshed successfully', timestamp: '2026-11-18T06:59:42Z', source: 'schema-registry' },
  { id: 'log_02', level: 'WARN', message: 'Resolver latency above 200ms on Analytics.events', timestamp: '2026-11-18T06:58:11Z', source: 'analytics-engine' },
  { id: 'log_03', level: 'INFO', message: 'Deployment dep_1042 is healthy', timestamp: '2026-11-18T06:55:03Z', source: 'deployment-worker' },
  { id: 'log_04', level: 'ERROR', message: 'Upstream timeout while fetching billing profile', timestamp: '2026-11-18T06:49:28Z', source: 'commerce-api' }
];
const latency: Record<string, number> = {};
const rootValue = {
  users: () => users,
  user: ({ id }: { id: string }) => users.find(u => u.id === id) ?? null,
  projects: () => projects,
  project: ({ id }: { id: string }) => projects.find(p => p.id === id) ?? null,
  deployments: () => deployments,
  logs: ({ level }: { level?: string }) => level ? logs.filter(l => l.level.toLowerCase() === level.toLowerCase()) : logs,
  health: () => 'GraphPulse GraphQL API operational',
  createProject: ({ name, description }: { name: string; description: string }) => {
    const project = { id: `prj_0${projects.length + 1}`, name, description, status: 'healthy', repository: 'acme/new-project', stars: 0, ownerId: 'usr_01' };
    projects.push(project); return project;
  },
  triggerDeployment: ({ projectId, environment }: { projectId: string; environment: string }) => {
    const deployment = { id: `dep_10${deployments.length + 43}`, projectId, environment, status: 'queued', url: `${projectId}.acme.dev`, commit: 'localdev', createdAt: new Date().toISOString(), duration: 0 };
    deployments.unshift(deployment); return deployment;
  }
};
const fields: Record<string, GraphQLFieldResolver<any, any>> = {
  'Project.owner': (p) => users.find(u => u.id === p.ownerId) ?? users[0],
  'Project.deployments': (p) => deployments.filter(d => d.projectId === p.id),
  'Deployment.project': (d) => projects.find(p => p.id === d.projectId) ?? projects[0]
};
for (const type of Object.values(schema.getTypeMap())) {
  if ('getFields' in type && typeof type.getFields === 'function') {
    const objectType = type as GraphQLObjectType;
    for (const field of Object.values(objectType.getFields())) {
      const key = `${objectType.name}.${field.name}`;
      if (fields[key]) {
        const resolver = fields[key];
        field.resolve = async (source, args, context, info) => {
          const start = performance.now();
          try { return await resolver(source, args, context, info); }
          finally { latency[key] = Number((performance.now() - start).toFixed(3)); }
        };
      }
    }
  }
}

export default async function handler(request: Request): Promise<Response> {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method === 'GET') return new Response(sdl, { status: 200, headers: { ...headers, 'content-type': 'text/plain; charset=utf-8' } });
  if (request.method !== 'POST') return new Response(JSON.stringify({ errors: [{ message: 'Method not allowed. Use GET or POST.' }] }), { status: 405, headers });
  const started = performance.now();
  try {
    const body = await request.json() as { query?: string; variables?: Record<string, unknown>; operationName?: string };
    if (!body.query || typeof body.query !== 'string') return new Response(JSON.stringify({ errors: [{ message: 'A GraphQL query string is required.' }] }), { status: 400, headers });
    const result = await graphql({ schema, source: body.query, rootValue, variableValues: body.variables, operationName: body.operationName });
    const executionTime = Number((performance.now() - started).toFixed(2));
    return new Response(JSON.stringify({ ...result, extensions: { ...(result.extensions ?? {}), executionTime, resolverTimings: latency, complexity: Math.max(1, (body.query.match(/\\w+/g) ?? []).length) } }), { status: result.errors?.length ? 400 : 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ errors: [{ message: error instanceof Error ? error.message : 'Invalid request body.' }] }), { status: 400, headers });
  }
}