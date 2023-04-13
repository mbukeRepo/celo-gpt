import { createHash } from "crypto";
import { readdir, readFile, stat } from "fs/promises";
import { Content, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown, MdxjsEsm } from "mdast-util-mdx";
import { toMarkdown } from "mdast-util-to-markdown";
import { mdxjs } from "micromark-extension-mdxjs";
import { ObjectExpression } from "estree";
import { Configuration, OpenAIApi } from "openai";
import { join } from "path";
import { u } from "unist-builder";
import { filter } from "unist-util-filter";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { inspect } from "util";

dotenv.config({
  path: "../.env",
});

const supabase = createClient(
  `https://${process.env.NEXT_PROJECT_ID}.supabase.co`,
  process.env.NEXT_ANON_KEY as string
);

/**
 * Extracts ES literals from an `estree` `ObjectExpression`
 * into a plain JavaScript object.
 */
function getObjectFromExpression(node: ObjectExpression) {
  return node.properties.reduce<
    Record<string, string | number | bigint | true | RegExp | undefined>
  >((object, property) => {
    if (property.type !== "Property") {
      return object;
    }

    const key =
      (property.key.type === "Identifier" && property.key.name) || undefined;
    const value =
      (property.value.type === "Literal" && property.value.value) || undefined;

    if (!key) {
      return object;
    }

    return {
      ...object,
      [key]: value,
    };
  }, {});
}

/**
 * Extracts the `meta` ESM export from the MDX file.
 *
 * This info is akin to frontmatter.
 */
function extractMetaExport(mdxTree: Root) {
  const metaExportNode = mdxTree.children.find(
    (node: any): node is MdxjsEsm => {
      return (
        node.type === "mdxjsEsm" &&
        node.data?.estree?.body[0]?.type === "ExportNamedDeclaration" &&
        node.data.estree.body[0].declaration?.type === "VariableDeclaration" &&
        node.data.estree.body[0].declaration.declarations[0]?.id.type ===
          "Identifier" &&
        node.data.estree.body[0].declaration.declarations[0].id.name === "meta"
      );
    }
  );

  if (!metaExportNode) {
    return undefined;
  }

  const objectExpression =
    (metaExportNode.data?.estree?.body[0]?.type === "ExportNamedDeclaration" &&
      metaExportNode.data.estree.body[0].declaration?.type ===
        "VariableDeclaration" &&
      metaExportNode.data.estree.body[0].declaration.declarations[0]?.id
        .type === "Identifier" &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].id.name ===
        "meta" &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].init
        ?.type === "ObjectExpression" &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].init) ||
    undefined;

  if (!objectExpression) {
    return undefined;
  }

  return getObjectFromExpression(objectExpression);
}

/**
 * Splits a `mdast` tree into multiple trees based on
 * a predicate function. Will include the splitting node
 * at the beginning of each tree.
 *
 * Useful to split a markdown file into smaller sections.
 */
function splitTreeBy(tree: Root, predicate: (node: Content) => boolean) {
  return tree.children.reduce<Root[]>((trees, node) => {
    const [lastTree] = trees.slice(-1);

    if (!lastTree || predicate(node)) {
      const tree: Root = u("root", [node]);
      return trees.concat(tree);
    }

    lastTree.children.push(node);
    return trees;
  }, []);
}

type Meta = ReturnType<typeof extractMetaExport>;

type ProcessedMdx = {
  checksum: string;
  meta: Meta;
  sections: string[];
};

/**
 * Processes MDX content for search indexing.
 * It extracts metadata, strips it of all JSX,
 * and splits it into sub-sections based on criteria.
 */
function processMdxForSearch(content: string): ProcessedMdx {
  const checksum = createHash("sha256").update(content).digest("base64");

  const mdxTree = fromMarkdown(content, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  });

  const meta = extractMetaExport(mdxTree);

  // Remove all MDX elements from markdown
  const mdTree = filter(
    mdxTree,
    (node) =>
      ![
        "mdxjsEsm",
        "mdxJsxFlowElement",
        "mdxJsxTextElement",
        "mdxFlowExpression",
        "mdxTextExpression",
      ].includes(node.type)
  );

  if (!mdTree) {
    return {
      checksum,
      meta,
      sections: [],
    };
  }

  const sectionTrees = splitTreeBy(mdTree, (node) => node.type === "heading");

  const sections = sectionTrees.map((tree) => toMarkdown(tree));

  return {
    checksum,
    meta,
    sections,
  };
}

async function walk(dir: string): Promise<string[]> {
  const immediateFiles = await readdir(dir);

  const recursiveFiles = await Promise.all(
    immediateFiles.map(async (file) => {
      const filePath = join(dir, file);
      const stats = await stat(filePath);
      if (stats.isDirectory()) {
        return walk(filePath);
      } else if (stats.isFile()) {
        return [filePath];
      } else {
        return [];
      }
    })
  );

  const flattenedFiles = recursiveFiles.reduce(
    (all, folderContents) => all.concat(folderContents),
    []
  );

  return flattenedFiles;
}

const failed: unknown[] = []
async function generateEmbeddings() {
  const markdownFiles = (await walk("scripts/data")).filter((fileName) =>
    /\.mdx?$/.test(fileName)
  );

  console.log(`Discovered ${markdownFiles.length} pages`);
  console.log("Checking which pages are new or have changed");
  for (const markdownFile of markdownFiles) {
    const path = markdownFile.replace(/^data/, "").replace(/\.mdx?$/, "");
    try {
      const contents = (await readFile(markdownFile)).toString("utf-8");
      // encodeURIComponent encodes all special charactors
      const escapedContent = encodeURIComponent(contents);
      const { checksum, meta, sections } = processMdxForSearch(escapedContent);      

      // Create/update page record. Intentionally clear checksum until we
      // have successfully generated all page sections.
      const { error: upsertPageError, data: page } = await supabase
        .from("page")
        .upsert({ checksum: null, path }, { onConflict: "path" })
        .select()
        .limit(1)
        .single();
      console.log(
        `Adding ${sections.length} page sections (with embeddings) for '${path}'`
      );
      for (const encodedSection of sections) {
        // decodeURIComponent decodes all special charactors
        const section = decodeURIComponent(encodedSection)
        // OpenAI recommends replacing newlines with spaces for best results (specific to embeddings)
        const input = section.replace(/\n/g, " ");

        try {
          const configuration = new Configuration({
            apiKey: process.env.OPENAI_KEY,
          });
          const openai = new OpenAIApi(configuration);

          const embeddingResponse = await openai.createEmbedding({
            model: "text-embedding-ada-002",
            input,
          });

          if (embeddingResponse.status !== 200) {
            throw new Error(inspect(embeddingResponse.data, false, 2));
          }

          const [responseData] = embeddingResponse.data.data;

          const { error: insertPageSectionError, data: pageSection } =
            await supabase
              .from("page_section")
              .insert({
                page_id: page?.id,
                content: section,
                token_count: embeddingResponse.data.usage.total_tokens,
                embedding: responseData.embedding,
              })
              .select()
              .limit(1)
              .single();

          if (insertPageSectionError) {
            throw insertPageSectionError;
          }
        } catch (err) {
          // TODO: decide how to better handle failed embeddings
          console.error(
            `Failed to generate embeddings for '${path}' page section starting with '${input.slice(
              0,
              40
            )}...'`
          );

          throw err;
        }
      }

      // Set page checksum so that we know this page was stored successfully
      const { error: updatePageError } = await supabase
        .from("page")
        .update({ checksum })
        .filter("id", "eq", page?.id);

      if (updatePageError) {
        throw updatePageError;
      }
    } catch (err) {
      console.error(
        `Page '${path}' or one/multiple of its page sections failed to store properly. Page has been marked with null checksum to indicate that it needs to be re-generated.`
      );
    }
  }
  console.log("Embedding generation complete");
}

async function main() {
  await generateEmbeddings();
}

main().catch((err) => console.error(err));
