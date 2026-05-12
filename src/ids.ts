import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const generate = customAlphabet(alphabet, 10);

export function newId(): string {
  return generate();
}
