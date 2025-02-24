export interface JustWatchResponse {
  data: {
    data: {
      popularTitles: {
        edges: JustWatchEdge[];
      };
    };
  };
}

export interface JustWatchEdge {
  node: {
    content: JustWatchContent;
  };
}

export interface JustWatchContent {
  title: string;
  externalIds: {
    imdbId: string | null;
  };
}

export interface PlatformCatalog {
  type: string;
  id: string;
  name: string;
  pageSize: number | null;
  extra: object[];
  extraSupported: string[];
}
