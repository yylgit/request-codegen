/* eslint-disable @typescript-eslint/no-empty-object-type */

export interface IModels {
  'GET/account/count': {
    Header: {}
    Path: {}
    Query: {}
    Body: {}
    Res: {
      data: number
    }
  }
  'GET/repository/{id}': {
    Header: {}
    Path: {
      id: number
    }
    Query: {
      versionId?: number
    }
    Body: {}
    Res: {
      data: {
        name?: string
      }
    }
  }
  'GET/repository/version/list': {
    Header: {}
    Path: {}
    Query: {
      limit: number
      repositoryId: number
      start?: number
    }
    Body: {}
    Res: {
      data: {
        items: string[]
        nextStart?: number
      }
    }
  }
  'POST/repository/version/create': {
    Header: {}
    Path: {}
    Query: {}
    Body: {
      name: string
      repositoryId: string
    }
    Res: {
      data: {
        id: string
      }
    }
  }
}
