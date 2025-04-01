const PLATFORM = "ARD";

source.enable = function (conf) {
  /**
   * @param conf: SourceV8PluginConfig (the SomeConfig.js)
   */
}

source.getHome = function (continuationToken) {
  /**
   * @param continuationToken: any?
   * @returns: VideoPager
   */
  const videos = []; // The results (PlatformVideo)
  const hasMore = false; // Are there more pages?
  const context = {
    continuationToken: continuationToken
  }; // Relevant data for the next page
  return new SomeHomeVideoPager(videos, hasMore, context);
}

source.searchSuggestions = function (query) {
  /**
   * @param query: string
   * @returns: string[]
   */

  const url = "https://api.ardmediathek.de/search-system/search/suggestions?resultCount=10&platform=MEDIA_THEK&query=" +
    encodeURIComponent(query);

  const respSearch = http.GET(url, {});

  if (respSearch.code >= 300) {
    throw new ScriptException("Failed to search with code " + respSearch.code + "\n" + respSearch.body);
  }
  if (respSearch.body == null || respSearch.body == "") {
    throw new ScriptException("Failed to search with code " + respSearch.code + " due to empty body")
  }

  const suggestions = JSON.parse(respSearch.body);
  return suggestions.map(x => x.title);
}

source.getSearchCapabilities = function () {
  return {
    types: [Type.Feed.Mixed],
    sorts: [],
    filters: []
  };
}

source.search = function (query, type, order, filters, continuationToken) {
  /**
   * @param query: string
   * @param type: string
   * @param order: string
   * @param filters: Map<string, Array<string>>
   * @param continuationToken: any?
   * @returns: VideoPager
   */

  let url =
    "https://api.ardmediathek.de/search-system/search/vods/ard?pageSize=48&platform=MEDIA_THEK&query=" +
    encodeURIComponent(query);

  if (order) {
    url += "&sortingCriteria=" + sortBy;
  }

  const respSearch = http.GET(url, {});

  if (respSearch.code >= 300) {
    throw new ScriptException("Failed to search with code " + respSearch.code + "\n" + respSearch.body);
  }
  if (respSearch.body == null || respSearch.body == "") {
    throw new ScriptException("Failed to search with code " + respSearch.code + " due to empty body")
  }

  const teasers = JSON.parse(respSearch.body).teasers;

  const videos =
    teasers.map(teaser => new PlatformVideo({
      id: new PlatformID(PLATFORM, teaser.show.publisher.id, 0),
      name: teaser.shortTitle,
      thumbnails: new Thumbnails([
        new Thumbnail(teaser.images.aspect16x9.src.replace("{width}", "720"), 720),
        new Thumbnail(teaser.images.aspect16x9.src.replace("{width}", "1080"), 1080),
      ]),
      author: new PlatformAuthorLink(
        new PlatformID(PLATFORM, teaser.show.coremediaId, 0),
        teaser.show.title,
        ("channel:" + teaser.show.self.href.split("groupings/")[1]),
        "../url/to/thumbnail.png"),
      uploadDate: Date.parse(teaser.broadcastedOn) / 1000,
      duration: teaser.duration,
      viewCount: null,
      url: "content-details:" + teaser.id,
      isLive: false
    }));

  const hasMore = false; // Are there more pages?
  const context = {
    query: query,
    type: type,
    order: order,
    filters: filters,
    continuationToken: continuationToken
  }; // Relevant data for the next page
  return new SomeSearchVideoPager(videos, hasMore, context);
}

source.getSearchChannelContentsCapabilities = function () {
  //This is an example of how to return search capabilities on a channel like available sorts, filters and which feed types are available (see source.js for more details)
  return {
    types: [Type.Feed.Mixed],
    sorts: [Type.Order.Chronological],
    filters: []
  };
}

source.searchChannelContents = function (url, query, type, order, filters, continuationToken) {
  /**
   * @param url: string
   * @param query: string
   * @param type: string
   * @param order: string
   * @param filters: Map<string, Array<string>>
   * @param continuationToken: any?
   * @returns: VideoPager
   */

  const videos = []; // The results (PlatformVideo)
  const hasMore = false; // Are there more pages?
  const context = {
    channelUrl: channelUrl,
    query: query,
    type: type,
    order: order,
    filters: filters,
    continuationToken: continuationToken
  }; // Relevant data for the next page
  return new SomeSearchChannelVideoPager(videos, hasMore, context);
}

source.searchChannels = function (query, continuationToken) {
  /**
   * @param query: string
   * @param continuationToken: any?
   * @returns: ChannelPager
   */

  const channels = []; // The results (PlatformChannel)
  const hasMore = false; // Are there more pages?
  const context = {
    query: query,
    continuationToken: continuationToken
  }; // Relevant data for the next page
  return new SomeChannelPager(channels, hasMore, context);
}

source.isChannelUrl = function (url) {
  /**
   * @param url: string
   * @returns: boolean
   */

  return url.startsWith("channel:");
}

source.getChannel = function (url) {
  const reqUrl =
    "https://api.ardmediathek.de/page-gateway/pages/ard/grouping/" + url.replace(/^channel:/, "")

  const respItem = http.GET(reqUrl, {});

  if (respItem.code >= 300) {
    throw new ScriptException("Failed to search with code " + respItem.code + "\n" + respItem.body);
  }
  if (respItem.body == null || respItem.body == "") {
    throw new ScriptException("Failed to search with code " + respItem.code + " due to empty body")
  }

  const content = JSON.parse(respItem.body);

  return new PlatformChannel({
    id: new PlatformID(PLATFORM, 0, 0),
    name: content.title,
    // thumbnail: ,
    banner: content.heroImage.src.replace("{width}", "1000"),
    // subscribers: subs,
    description: content.synopsis,
    url: content.links.homepage.href,
    links: {}
  });
}

source.getChannelContents = function (url, type, order, filters, continuationToken) {
  /**
   * @param url: string
   * @param type: string
   * @param order: string
   * @param filters: Map<string, Array<string>>
   * @param continuationToken: any?
   * @returns: VideoPager
   */

  const reqUrl =
    "https://api.ardmediathek.de/page-gateway/pages/ard/grouping/" + url.replace(/^channel:/, "")

  const respItem = http.GET(reqUrl, {});

  if (respItem.code >= 300) {
    throw new ScriptException("Failed to search with code " + respItem.code + "\n" + respItem.body);
  }
  if (respItem.body == null || respItem.body == "") {
    throw new ScriptException("Failed to search with code " + respItem.code + " due to empty body")
  }

  const content = JSON.parse(respItem.body);

  const videos =
    content.widgets[0].teasers.map(teaser => new PlatformVideo({
      id: new PlatformID(PLATFORM, teaser.show.publisher.id, 0),
      name: teaser.shortTitle,
      thumbnails: new Thumbnails([
        new Thumbnail(teaser.images.aspect16x9.src.replace("{width}", "720"), 720),
        new Thumbnail(teaser.images.aspect16x9.src.replace("{width}", "1080"), 1080),
      ]),
      author: new PlatformAuthorLink(
        new PlatformID(PLATFORM, teaser.show.coremediaId, 0),
        teaser.show.title,
        ("channel:" + teaser.show.self.href.split("groupings/")[1]),
        "../url/to/thumbnail.png"),
      uploadDate: Date.parse(teaser.broadcastedOn) / 1000,
      duration: teaser.duration,
      viewCount: null,
      url: "content-details:" + teaser.id,
      isLive: false
    }));

  const hasMore = false; // Are there more pages?
  const context = {
    url: url,
    // query: query,
    type: type,
    order: order,
    filters: filters,
    continuationToken: continuationToken
  }; // Relevant data for the next page
  return new SomeChannelVideoPager(videos, hasMore, context);
}

source.isContentDetailsUrl = function (url) {
  /**
   * @param url: string
   * @returns: boolean
   */

  return url.startsWith("content-details");
}

source.getContentDetails = function (url) {
  /**
   * @param url: string
   * @returns: PlatformVideoDetails
   */

  let reqUrl = "https://api.ardmediathek.de/page-gateway/pages/ard/item/" +
    url.replace(/^content-details:/, "") +
    "?embedded=false&mcV6=true";

  const respItem = http.GET(reqUrl, {});

  if (respItem.code >= 300) {
    throw new ScriptException("Failed to search with code " + respItem.code + "\n" + respItem.body);
  }
  if (respItem.body == null || respItem.body == "") {
    throw new ScriptException("Failed to search with code " + respItem.code + " due to empty body")
  }

  const item = JSON.parse(respItem.body);

  return new PlatformVideoDetails({
    id: new PlatformID(PLATFORM, "SomeId", 0),
    name: item.title,
    author: new PlatformAuthorLink(
      new PlatformID(PLATFORM, item.tracking.atiCustomVars.channel, 0),
      item.tracking.atiCustomVars.channel,
      "https://platform.com/your/channel/url",
      "../url/to/thumbnail.png"),
    uploadDate: Date.parse(item.widgets[0].broadcastedOn) / 1000,
    duration: item.tracking.atiCustomVars.clipLength,
    url: url,
    isLive: false,

    description: item.widgets[0].mediaCollection.embedded.meta.synopsis,
    video: new VideoSourceDescriptor(
      item.widgets[0].mediaCollection.embedded.streams[0].media.map(media =>
        new VideoUrlSource({
          width: media.maxHResolutionPx,
          height: media.maxVResolutionPx,
          container: media.mimeType,
          codec: media.videoCodec,
          name: media.forcedLabel,
          duration: item.tracking.atiCustomVars.clipLength,
          url: media.url
        })
      )
    ),
  });
}

source.getComments = function (url, continuationToken) {
  /**
   * @param url: string
   * @param continuationToken: any?
   * @returns: CommentPager
   */

  const comments = []; // The results (Comment)
  const hasMore = false; // Are there more pages?
  const context = {
    url: url,
    continuationToken: continuationToken
  }; // Relevant data for the next page
  return new SomeCommentPager(comments, hasMore, context);

}
source.getSubComments = function (comment) {
  /**
   * @param comment: Comment
   * @returns: SomeCommentPager
   */

  if (typeof comment === 'string') {
    comment = JSON.parse(comment);
  }

  return getCommentsPager(comment.context.claimId, comment.context.claimId, 1, false, comment.context.commentId);
}

class SomeCommentPager extends CommentPager {
  constructor(results, hasMore, context) {
    super(results, hasMore, context);
  }

  nextPage() {
    return source.getComments(this.context.url, this.context.continuationToken);
  }
}

class SomeHomeVideoPager extends VideoPager {
  constructor(results, hasMore, context) {
    super(results, hasMore, context);
  }

  nextPage() {
    return source.getHome(this.context.continuationToken);
  }
}

class SomeSearchVideoPager extends VideoPager {
  constructor(results, hasMore, context) {
    super(results, hasMore, context);
  }

  nextPage() {
    return source.search(this.context.query, this.context.type, this.context.order, this.context.filters, this.context.continuationToken);
  }
}

class SomeSearchChannelVideoPager extends VideoPager {
  constructor(results, hasMore, context) {
    super(results, hasMore, context);
  }

  nextPage() {
    return source.searchChannelContents(this.context.channelUrl, this.context.query, this.context.type, this.context.order, this.context.filters, this.context.continuationToken);
  }
}

class SomeChannelPager extends ChannelPager {
  constructor(results, hasMore, context) {
    super(results, hasMore, context);
  }

  nextPage() {
    return source.searchChannelContents(this.context.query, this.context.continuationToken);
  }
}

class SomeChannelVideoPager extends VideoPager {
  constructor(results, hasMore, context) {
    super(results, hasMore, context);
  }

  nextPage() {
    return source.getChannelContents(this.context.url, this.context.type, this.context.order, this.context.filters, this.context.continuationToken);
  }
}
