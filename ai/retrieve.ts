import fs from "fs/promises";
import path from "path";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const CHUNK_SIZE = 1200;

const synonyms: Record<string, string[]> = {
    salary: ["salary", "wages", "pay", "income", "vetan", "tankhwa", "pagar", "payment"],
    police: ["police", "thana", "fir", "arrest", "custody", "bike", "vehicle", "gaadi"],
    landlord: ["landlord", "tenant", "rent", "kiraya", "house", "ghar", "evict"],
    consumer: ["consumer", "refund", "product", "defect", "replacement", "warranty"],
    accident: ["accident", "injury", "insurance", "claim", "compensation"],
    domestic: ["domestic", "violence", "abuse", "marriage", "divorce"],
};

function splitIntoChunks(text: string) {
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    return chunks;
}

export async function retrieveRelevantContext(question: string) {
    const files = await fs.readdir(KNOWLEDGE_DIR);

    const words = question
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const keywords = new Set<string>();

    for (const word of words) {
        keywords.add(word);

        for (const key in synonyms) {
            if (synonyms[key].includes(word)) {
                synonyms[key].forEach((v) => keywords.add(v));
            }
        }
    }

    const scoredChunks: {
        file: string;
        chunk: string;
        score: number;
    }[] = [];

    for (const file of files) {
        if (!file.endsWith(".md")) continue;

        const content = await fs.readFile(
            path.join(KNOWLEDGE_DIR, file),
            "utf8"
        );

        const chunks = splitIntoChunks(content);

        for (const chunk of chunks) {
            const lower = chunk.toLowerCase();

            let score = 0;

            for (const word of keywords) {
                if (lower.includes(word)) {
                    score++;
                }
            }

            if (score > 0) {
                scoredChunks.push({
                    file,
                    chunk,
                    score,
                });
            }
        }
    }

    scoredChunks.sort((a, b) => b.score - a.score);

    const top = scoredChunks.slice(0, 3);

    return {
        file: top.map((t) => t.file).join(", "),
        context: top.map((t) => t.chunk).join("\n\n----------------------\n\n"),
        score: top.length ? top[0].score : 0,
    };
}