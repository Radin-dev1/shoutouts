const CONFIG = {
  owner: "Radin-dev1",
  repo: "shoutouts",
  branch: "main",
  path: "data/shoutouts.json",
  // Store a GitHub fine-grained token in Apps Script Properties as GITHUB_TOKEN.
  // The token only needs Contents: Read and write access for this repository.
  tokenPropertyName: "GITHUB_TOKEN",
};

function onFormSubmit(event) {
  const response = formResponseToShoutout_(event);
  if (!response.message) {
    return;
  }

  appendShoutout_(response);
}

function formResponseToShoutout_(event) {
  const named = event.namedValues || {};

  return {
    id: Utilities.getUuid(),
    createdAt: new Date().toISOString(),
    sender: firstAnswer_(named, ["Your name", "Name", "From", "Who are you?"]) || "Anonymous",
    recipient: firstAnswer_(named, ["Who are you shouting out?", "Recipient", "To", "Shoutout to"]),
    message: firstAnswer_(named, ["Shoutout", "Message", "What do you want to say?", "Response"]),
  };
}

function firstAnswer_(namedValues, possibleQuestionTitles) {
  for (const title of possibleQuestionTitles) {
    const answer = namedValues[title];
    if (answer && answer[0]) {
      return String(answer[0]).trim();
    }
  }

  return "";
}

function appendShoutout_(shoutout) {
  const token = PropertiesService.getScriptProperties().getProperty(CONFIG.tokenPropertyName);
  if (!token) {
    throw new Error(`Missing script property: ${CONFIG.tokenPropertyName}`);
  }

  const file = getGithubFile_(token);
  const existing = file.content
    ? JSON.parse(Utilities.newBlob(Utilities.base64Decode(file.content)).getDataAsString())
    : [];
  existing.push(shoutout);

  putGithubFile_(token, file.sha, JSON.stringify(existing, null, 2) + "\n");
}

function getGithubFile_(token) {
  const url = githubContentsUrl_() + `?ref=${encodeURIComponent(CONFIG.branch)}`;
  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: githubHeaders_(token),
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() === 404) {
    return { sha: null, content: "" };
  }

  assertGithubOk_(response);
  return JSON.parse(response.getContentText());
}

function putGithubFile_(token, sha, content) {
  const body = {
    message: "Add form shoutout",
    branch: CONFIG.branch,
    content: Utilities.base64Encode(content),
  };

  if (sha) {
    body.sha = sha;
  }

  const response = UrlFetchApp.fetch(githubContentsUrl_(), {
    method: "put",
    contentType: "application/json",
    headers: githubHeaders_(token),
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  assertGithubOk_(response);
}

function githubContentsUrl_() {
  return `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
}

function githubHeaders_(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function assertGithubOk_(response) {
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error(`GitHub API error ${code}: ${response.getContentText()}`);
  }
}
