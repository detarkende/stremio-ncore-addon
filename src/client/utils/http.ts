export async function handleHttpError(response: Response): Promise<void> {
  let errorMessage = `HTTP error. Status: ${response.status}`;
  try {
    const responseText = await response.text();
    errorMessage = responseText;
  } catch {
    /* empty */
  }
  throw new Error(errorMessage);
}
