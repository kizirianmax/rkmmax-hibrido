/**
 * GITHUB OAUTH AUTHENTICATION
 * Fluxo OAuth2 para autorizar Serginho a acessar GitHub
 *
 * Endpoints:
 * - POST /api/github-oauth/authorize → Inicia fluxo OAuth
 * - GET /api/github-oauth/callback → Recebe código e troca por token
 * - POST /api/github-oauth/validate → Valida token existente
 * - POST /api/github-oauth/revoke → Revoga token
 */

const https = require("https");
const querystring = require("querystring");

// Configuração do GitHub OAuth
const GITHUB_CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET =
  process.env.GITHUB_OAUTH_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI =
  process.env.GITHUB_OAUTH_REDIRECT_URI ||
  process.env.GITHUB_REDIRECT_URI ||
  "https://kizirianmax.site/api/github-oauth/callback";

// Armazenamento em memória (em produção, usar banco de dados)
const tokenStore = new Map();

/**
 * Fazer requisição HTTPS
 */
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            json: () => JSON.parse(body),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(typeof data === "string" ? data : JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Gerar URL de autorização do GitHub
 */
function generateAuthorizationUrl(state) {
  const params = querystring.stringify({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "repo,workflow,user",
    state: state,
    allow_signup: true,
  });

  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * Trocar código por token
 */
async function exchangeCodeForToken(code) {
  const data = querystring.stringify({
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    code: code,
    redirect_uri: GITHUB_REDIRECT_URI,
  });

  const options = {
    hostname: "github.com",
    path: "/login/oauth/access_token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(data),
      Accept: "application/json",
      "User-Agent": "RKMMAX-Serginho",
    },
  };

  try {
    const response = await httpsRequest(options, data);
    const result = response.json();

    if (result.error) {
      throw new Error(`GitHub OAuth error: ${result.error_description}`);
    }

    return result.access_token;
  } catch (error) {
    throw new Error(`Erro ao trocar código por token: ${error.message}`);
  }
}

/**
 * Validar token com GitHub
 */
async function validateToken(token) {
  const options = {
    hostname: "api.github.com",
    path: "/user",
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "RKMMAX-Serginho",
      Accept: "application/vnd.github.v3+json",
    },
  };

  try {
    const response = await httpsRequest(options);
    if (response.status === 200) {
      const user = response.json();
      return {
        valid: true,
        user: {
          login: user.login,
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      };
    }
    return { valid: false };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Handler principal
 */
module.exports = async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // POST /api/github-oauth/authorize
    if (pathname === "/api/github-oauth/authorize" && req.method === "POST") {
      if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(500).json({
          error: "GitHub OAuth não configurado",
          message: "GITHUB_OAUTH_CLIENT_ID e GITHUB_OAUTH_CLIENT_SECRET não estão definidos",
        });
      }

      const state = Math.random().toString(36).substring(7);
      const authUrl = generateAuthorizationUrl(state);

      // Armazenar state para validar no callback
      tokenStore.set(`state_${state}`, {
        timestamp: Date.now(),
        state: state,
      });

      return res.status(200).json({
        success: true,
        authUrl: authUrl,
        state: state,
        message: "Clique no link para autorizar Serginho a acessar seu GitHub",
      });
    }

    // GET /api/github-oauth/callback
    if (pathname === "/api/github-oauth/callback" && req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const code = url.searchParams.get("code");
      const _state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        return res.status(400).json({
          error: "Autorização negada",
          message: error,
        });
      }

      if (!code) {
        return res.status(400).json({
          error: "Código não recebido",
        });
      }

      try {
        const token = await exchangeCodeForToken(code);

        // Validar token
        const validation = await validateToken(token);

        if (!validation.valid) {
          return res.status(400).json({
            error: "Token inválido",
            message: validation.error,
          });
        }

        // Armazenar token (em produção, salvar em banco de dados)
        tokenStore.set(`token_${validation.user.login}`, {
          token: token,
          user: validation.user,
          timestamp: Date.now(),
        });

        // Retornar sucesso com token
        return res.status(200).json({
          success: true,
          token: token,
          user: validation.user,
          message: `✅ Autorização bem-sucedida! Olá, ${validation.user.name || validation.user.login}!`,
        });
      } catch (error) {
        return res.status(500).json({
          error: "Erro na autenticação",
          message: error.message,
        });
      }
    }

    // POST /api/github-oauth/validate
    if (pathname === "/api/github-oauth/validate" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const { token } = JSON.parse(body);

          if (!token) {
            return res.status(400).json({
              error: "Token não fornecido",
            });
          }

          const validation = await validateToken(token);

          return res.status(200).json({
            valid: validation.valid,
            user: validation.user,
            error: validation.error,
          });
        } catch (error) {
          res.status(500).json({
            error: "Erro ao validar token",
            message: error.message,
          });
        }
      });
      return;
    }

    // POST /api/github-oauth/revoke
    if (pathname === "/api/github-oauth/revoke" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const { username } = JSON.parse(body);

          if (!username) {
            return res.status(400).json({
              error: "Username não fornecido",
            });
          }

          tokenStore.delete(`token_${username}`);

          return res.status(200).json({
            success: true,
            message: `Token revogado para ${username}`,
          });
        } catch (error) {
          res.status(500).json({
            error: "Erro ao revogar token",
            message: error.message,
          });
        }
      });
      return;
    }

    // 404
    res.status(404).json({
      error: "Endpoint não encontrado",
      available: [
        "POST /api/github-oauth/authorize",
        "GET /api/github-oauth/callback",
        "POST /api/github-oauth/validate",
        "POST /api/github-oauth/revoke",
      ],
    });
  } catch (error) {
    console.error("GitHub OAuth Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};
