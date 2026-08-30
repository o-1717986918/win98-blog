import { realpath, stat } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

const inside = (root, candidate) => candidate === root || candidate.startsWith(`${root}${sep}`);

async function nearestExistingParent(candidate) {
  let current = candidate;
  while (true) {
    try { return await realpath(current); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = dirname(current);
      if (parent === current) return null;
      current = parent;
    }
  }
}

export async function createContentPathPolicy(projectRoot, allowedRelativeRoots) {
  const root = await realpath(resolve(projectRoot));
  const allowed = [];
  for (const relativeRoot of allowedRelativeRoots) {
    const lexical = resolve(root, relativeRoot);
    const actual = await realpath(lexical);
    if (!inside(root, actual)) throw new Error(`内容根目录越出项目边界：${relativeRoot}`);
    allowed.push({ lexical, actual });
  }

  const lexicalCandidate = (value, extensionRequired) => {
    if (typeof value !== 'string' || value.includes('\0')) return null;
    const candidate = resolve(root, value.replaceAll('/', sep));
    const owner = allowed.find(({ lexical }) => inside(lexical, candidate));
    if (!owner || (extensionRequired && !/\.(?:md|mdx)$/iu.test(candidate))) return null;
    return { candidate, owner };
  };

  return {
    async existing(value, extensionRequired = true) {
      const resolved = lexicalCandidate(value, extensionRequired);
      if (!resolved) return null;
      try {
        const actual = await realpath(resolved.candidate);
        if (!inside(resolved.owner.actual, actual) || !(await stat(actual)).isFile()) return null;
        return actual;
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    },

    async newFile(value, extensionRequired = true) {
      const resolved = lexicalCandidate(value, extensionRequired);
      if (!resolved) return null;
      const parent = await nearestExistingParent(dirname(resolved.candidate));
      if (!parent || !inside(resolved.owner.actual, parent)) return null;
      return resolved.candidate;
    },
  };
}
