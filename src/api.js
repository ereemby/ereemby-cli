import { getToken, getBaseUrl } from './config.js';

function getHeaders() {
  const token = getToken();
  if (!token) {
    throw new Error('Voce nao esta autenticado. Rode: ereemby login <token>');
  }
  return {
    'x-theme-token': token,
    'Content-Type': 'application/json',
  };
}
export async function fetchFiles() {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/theme/files`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao buscar arquivos (${response.status}): ${text}`);
  }

  return response.json();
}

export async function fetchFileContent(fileId) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/theme/file/${fileId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao buscar conteudo do arquivo (${response.status}): ${text}`);
  }

  return response.json();
}

export async function createFile(directory) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/theme/file`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ directory }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao criar arquivo (${response.status}): ${text}`);
  }

  return response.json();
}

export async function deleteFile(fileId) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/theme/file/${fileId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao deletar arquivo (${response.status}): ${text}`);
  }

  return response.json();
}

export async function uploadFile(fileId, content) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/theme/file/${fileId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao enviar arquivo (${response.status}): ${text}`);
  }

  return response.json();
}
