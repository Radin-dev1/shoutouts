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
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const response = formResponseToShoutout_(event);
    if (!response.message) {
      throw new Error("No shoutout message found. Check the question titles in Code.gs.");
    }

    appendShoutout_(response);
  } finally {
    lock.releaseLock();
  }
}

function formResponseToShoutout_(event) {
  const named = event.namedValues || {};
  const fallbackMessage = longestAnswer_(named);

  return {
    id: Utilities.getUuid(),
    createdAt: new Date().toISOString(),
    sender: firstAnswer_(named, ["your Name", "Your name", "Name", "From", "Who are you?"]) || "Anonymous",
    recipient: firstAnswer_(named, [
      "Who are you shouting out?",
      "Recipient",
      "To",
      "Shoutout to",
    ]),
    intensity: firstAnswer_(named, ["how much do you want to shout them out", "Intensity", "Rating"]),
    message:
      firstAnswer_(named, [
        "Untitled Title",
        "shoutout somebody/something",
        "Shoutout",
        "Message",
        "What do you want to say?",
        "Response",
      ]) || fallbackMessage,
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

function longestAnswer_(namedValues) {
  let best = "";
  for (const title in namedValues) {
    const value = namedValues[title] && namedValues[title][0] ? String(namedValues[title][0]).trim() : "";
    if (
      value.length > best.length &&
      title !== "Timestamp" &&
      title !== "your Name" &&
      title !== "how much do you want to shout them out"
    ) {
      best = value;
    }
  }

  return best;
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
