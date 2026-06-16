import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { messages, conversations } from "@db/schema";
import { eq } from "drizzle-orm";
import { model } from "./lib/gemini";
import { model } from "./lib/gemini";
import { retrieveRelevantContext } from "./ai/retrieve";

// Structured legal response type
interface StructuredLegalResponse {
  understanding: string;
  explanation: string;
  actionableSteps: string[];
  legalReferences: { name: string; section: string; description: string }[];
  disclaimer: string;
}

// Generate a contextual AI legal response based on user query
function generateLegalResponse(query: string): { content: string; structured: StructuredLegalResponse } {
  const lowerQuery = query.toLowerCase();

  // Detect language
  const isHindi = /[\u0900-\u097F]/.test(query);
  const isHinglish = /(hai|kya|mera|police|bike|salary|landlord|nikal|karu|mili|rahe)/.test(lowerQuery) && !isHindi;

  // Pattern matching for common legal queries
  const patterns = {
    police: lowerQuery.includes('police') || lowerQuery.includes('bike') || lowerQuery.includes('gaadi') || lowerQuery.includes('seize'),
    salary: lowerQuery.includes('salary') || lowerQuery.includes('wage') || lowerQuery.includes('payment') || lowerQuery.includes('mili') || lowerQuery.includes('paisa'),
    landlord: lowerQuery.includes('landlord') || lowerQuery.includes('rent') || lowerQuery.includes('evict') || lowerQuery.includes('nikal') || lowerQuery.includes('ghar'),
    accident: lowerQuery.includes('accident') || lowerQuery.includes('injury') || lowerQuery.includes('claim'),
    notice: lowerQuery.includes('notice') || lowerQuery.includes('court'),
    domestic: lowerQuery.includes('domestic') || lowerQuery.includes('violence') || lowerQuery.includes('abuse') || lowerQuery.includes('marriage') || lowerQuery.includes('divorce'),
    consumer: lowerQuery.includes('consumer') || lowerQuery.includes('product') || lowerQuery.includes('defect') || lowerQuery.includes('refund'),
  };

  let response: StructuredLegalResponse;

  if (patterns.police) {
    if (isHindi || isHinglish) {
      response = {
        understanding: "Aapki gaadi police ne li hai, aur aap jaanna chahte hain ki kya kar sakte hain.",
        explanation: "Police kisi bhi vehicle ko sirf valid reason se hi seize kar sakti hai. Agar aapka vehicle accident mein involve tha, toh police ko investigation ke liye vehicle ko apne paas rakhne ka adhikar hai (Section 102 BNSS).",
        actionableSteps: [
          "Police se seizure memo ya receipt maangein",
          "FIR ki copy maangein agar registered hai",
          "Vehicle release ke liye court mein application dein",
          "Ek lawyer se consult karein agar police refuse karti hai"
        ],
        legalReferences: [
          { name: "BNSS", section: "Section 102", description: "Power of police officer to seize certain property" },
          { name: "BNS", section: "Section 125", description: "Wantonly giving provocation with intent to cause riot" },
          { name: "Motor Vehicles Act", section: "Section 207", description: "Power to detain vehicles used without certificate of registration" }
        ],
        disclaimer: "Yeh information sirf educational purposes ke liye hai. Professional legal advice ke liye ek qualified lawyer se consult karein."
      };
    } else {
      response = {
        understanding: "Your vehicle has been seized by the police and you want to know your rights.",
        explanation: "Police can only seize a vehicle under valid legal grounds. If your vehicle was involved in an accident, the police have the authority to retain it for investigation purposes under Section 102 of BNSS. They must provide you with a seizure memo.",
        actionableSteps: [
          "Ask police for a seizure memo/receipt",
          "Request a copy of the FIR if registered",
          "File an application for vehicle release in court",
          "Consult a lawyer if police refuse to comply"
        ],
        legalReferences: [
          { name: "BNSS", section: "Section 102", description: "Power of police officer to seize certain property" },
          { name: "BNS", section: "Section 125", description: "Wantonly giving provocation with intent to cause riot" },
          { name: "Motor Vehicles Act", section: "Section 207", description: "Power to detain vehicles used without certificate of registration" }
        ],
        disclaimer: "This information is for educational purposes only and should not be considered professional legal advice."
      };
    }
  } else if (patterns.salary) {
    if (isHindi || isHinglish) {
      response = {
        understanding: "Aapki salary 3 mahine se nahi mili hai aur aap apne rights jaanna chahte hain.",
        explanation: "Bharat mein, Payment of Wages Act 1936 ke under employer ko timely salary dena mandatory hai. Agar employer 3 mahine se salary nahi de raha, toh yeh illegal hai aur aapke paas legal remedies hain.",
        actionableSteps: [
          "Employer ko written notice bhejein salary demand ke liye",
          "Labour Commissioner ke office mein complaint file karein",
          "Industrial Tribunal mein claim file karein",
          "Labour Court mein case file kar sakte hain"
        ],
        legalReferences: [
          { name: "Payment of Wages Act", section: "Section 4-5", description: "Time of payment of wages and deductions" },
          { name: "Industrial Disputes Act", section: "Section 33C", description: "Recovery of money due from an employer" },
          { name: "Constitution of India", section: "Article 23", description: "Prohibition of traffic in human beings and forced labour" }
        ],
        disclaimer: "Yeh information sirf educational purposes ke liye hai. Professional legal advice ke liye ek qualified lawyer se consult karein."
      };
    } else {
      response = {
        understanding: "You haven't received your salary for 3 months and want to know your legal rights.",
        explanation: "Under the Payment of Wages Act, 1936, employers in India are legally obligated to pay wages on time. Non-payment of salary for 3 months is a violation of labour laws and you have several legal remedies available.",
        actionableSteps: [
          "Send a written demand notice to your employer",
          "File a complaint with the Labour Commissioner's office",
          "File a claim before the Industrial Tribunal",
          "Approach the Labour Court for recovery"
        ],
        legalReferences: [
          { name: "Payment of Wages Act", section: "Section 4-5", description: "Time of payment of wages and deductions" },
          { name: "Industrial Disputes Act", section: "Section 33C", description: "Recovery of money due from an employer" },
          { name: "Constitution of India", section: "Article 23", description: "Prohibition of traffic in human beings and forced labour" }
        ],
        disclaimer: "This information is for educational purposes only and should not be considered professional legal advice."
      };
    }
  } else if (patterns.landlord) {
    if (isHindi || isHinglish) {
      response = {
        understanding: "Aapka landlord aapko ghar se nikal raha hai aur aap apne rights jaanna chahte hain.",
        explanation: "Bharat mein, ek landlord tenant ko bina proper notice aur valid reason ke nahi nikaal sakta. Rent Control Acts ke under tenant ke paas kaafi rights hain. Landlord ko proper notice period dena compulsory hai.",
        actionableSteps: [
          "Rent agreement check karein notice period ke liye",
          "Police complaint register karein agar forceful eviction ho",
          "Rent Authority/Court mein case file karein",
          "Sarvesh Kumar vs. Om Prakash (2021) ka reference dein"
        ],
        legalReferences: [
          { name: "Model Tenancy Act", section: "Section 10", description: "Grounds for eviction of tenant" },
          { name: "BNS", section: "Section 352", description: "Criminal trespass" },
          { name: "Constitution of India", section: "Article 21", description: "Right to life and personal liberty includes right to shelter" }
        ],
        disclaimer: "Yeh information sirf educational purposes ke liye hai. Professional legal advice ke liye ek qualified lawyer se consult karein."
      };
    } else {
      response = {
        understanding: "Your landlord is trying to evict you and you want to understand your tenant rights.",
        explanation: "In India, a landlord cannot evict a tenant without proper notice and valid grounds. Under various Rent Control Acts, tenants have significant protections. The landlord must provide adequate notice period as specified in your rent agreement or as mandated by state law.",
        actionableSteps: [
          "Check your rent agreement for notice period clauses",
          "Register a police complaint if facing forceful eviction",
          "File a case with the Rent Authority/Court",
          "Reference Sarvesh Kumar vs. Om Prakash (2021) judgment"
        ],
        legalReferences: [
          { name: "Model Tenancy Act", section: "Section 10", description: "Grounds for eviction of tenant" },
          { name: "BNS", section: "Section 352", description: "Criminal trespass" },
          { name: "Constitution of India", section: "Article 21", description: "Right to life and personal liberty includes right to shelter" }
        ],
        disclaimer: "This information is for educational purposes only and should not be considered professional legal advice."
      };
    }
  } else if (patterns.accident) {
    response = {
      understanding: isHindi || isHinglish
        ? "Aapka accident hua hai aur aap compensation ya legal process jaanna chahte hain."
        : "You were involved in an accident and want to know about compensation and legal procedures.",
      explanation: isHindi || isHinglish
        ? "Motor Vehicles Act 1988 ke under, accident victims ko compensation ka adhikar hai. Aap Motor Accidents Claims Tribunal (MACT) mein claim file kar sakte hain."
        : "Under the Motor Vehicles Act, 1988, accident victims are entitled to compensation. You can file a claim with the Motor Accidents Claims Tribunal (MACT).",
      actionableSteps: [
        isHindi || isHinglish ? "FIR register karayein" : "Register an FIR",
        isHindi || isHinglish ? "Medical reports aur bills collect karein" : "Collect medical reports and bills",
        isHindi || isHinglish ? "MACT mein compensation claim file karein" : "File a compensation claim with MACT",
        isHindi || isHinglish ? "Insurance company ko inform karein" : "Inform the insurance company"
      ],
      legalReferences: [
        { name: "Motor Vehicles Act", section: "Section 140", description: "No fault liability" },
        { name: "Motor Vehicles Act", section: "Section 166", description: "Application for compensation" },
        { name: "BNS", section: "Section 106", description: "Causing death by negligence" }
      ],
      disclaimer: isHindi || isHinglish
        ? "Yeh information sirf educational purposes ke liye hai. Professional legal advice ke liye ek qualified lawyer se consult karein."
        : "This information is for educational purposes only and should not be considered professional legal advice."
    };
  } else if (patterns.domestic) {
    response = {
      understanding: isHindi || isHinglish
        ? "Aap domestic violence ya marital issue face kar rahe hain aur help chahte hain."
        : "You are facing domestic violence or marital issues and need legal help.",
      explanation: isHindi || isHinglish
        ? "Domestic Violence Act 2005 ke under, aapko protection ka adhikar hai. Aap Protection Officer se contact kar sakte hain ya court mein protection order maang sakte hain."
        : "Under the Protection of Women from Domestic Violence Act, 2005, you have the right to seek protection. You can contact a Protection Officer or approach the court for a protection order.",
      actionableSteps: [
        isHindi || isHinglish ? "National Commission for Women helpline: 7827170170" : "Call National Commission for Women helpline: 7827170170",
        isHindi || isHinglish ? "Police mein complaint register karein" : "Register a complaint with police",
        isHindi || isHinglish ? "Protection Officer se contact karein" : "Contact a Protection Officer",
        isHindi || isHinglish ? "Magistrate ke paas protection order ke liye apply karein" : "Apply for a protection order before a Magistrate"
      ],
      legalReferences: [
        { name: "PWDV Act", section: "Section 12", description: "Application to Magistrate" },
        { name: "PWDV Act", section: "Section 18", description: "Protection orders" },
        { name: "BNS", section: "Section 85", description: "Cruelty by husband or relatives" }
      ],
      disclaimer: isHindi || isHinglish
        ? "Yeh information sirf educational purposes ke liye hai. Professional legal advice ke liye ek qualified lawyer se consult karein."
        : "This information is for educational purposes only and should not be considered professional legal advice."
    };
  } else if (patterns.consumer) {
    response = {
      understanding: isHindi || isHinglish
        ? "Aapko defective product mila hai ya refund nahi mil raha hai."
        : "You received a defective product or are not getting a refund.",
      explanation: isHindi || isHinglish
        ? "Consumer Protection Act 2019 ke under, aapko defective goods ke against action lene ka adhikar hai. Aap consumer court mein complaint file kar sakte hain."
        : "Under the Consumer Protection Act, 2019, you have the right to take action against defective goods. You can file a complaint in the consumer court.",
      actionableSteps: [
        isHindi || isHinglish ? "Company ko written complaint bhejein" : "Send a written complaint to the company",
        isHindi || isHinglish ? "Consumer helpline: 1915" : "Call Consumer helpline: 1915",
        isHindi || isHinglish ? "District Consumer Forum mein complaint file karein" : "File a complaint with the District Consumer Forum",
        isHindi || isHinglish ? "Evidence collect karein - bills, photos, emails" : "Collect evidence - bills, photos, emails"
      ],
      legalReferences: [
        { name: "Consumer Protection Act", section: "Section 2(7)", description: "Definition of consumer" },
        { name: "Consumer Protection Act", section: "Section 35", description: "Complaints before District Commission" },
        { name: "Consumer Protection Act", section: "Section 94", description: "Product liability" }
      ],
      disclaimer: isHindi || isHinglish
        ? "Yeh information sirf educational purposes ke liye hai. Professional legal advice ke liye ek qualified lawyer se consult karein."
        : "This information is for educational purposes only and should not be considered professional legal advice."
    };
  } else if (patterns.notice) {
    response = {
      understanding: isHindi || isHinglish
        ? "Aapko ek legal notice mila hai aur aap samajhna chahte hain ki kya karna chahiye."
        : "You received a legal notice and want to know what steps to take.",
      explanation: isHindi || isHinglish
        ? "Legal notice ek formal communication hai jo dispute ko resolve karne ka last chance deta hai. Notice ko ignore nahi karna chahiye - timely reply dena compulsory hai (generally 15-30 days)."
        : "A legal notice is a formal communication that provides a final opportunity to resolve a dispute. You should never ignore a legal notice - replying within the stipulated time (usually 15-30 days) is crucial.",
      actionableSteps: [
        isHindi || isHinglish ? "Notice ko dhyan se padhein aur deadline note karein" : "Read the notice carefully and note the deadline",
        isHindi || isHinglish ? "Ek qualified lawyer se immediately consult karein" : "Consult a qualified lawyer immediately",
        isHindi || isHinglish ? "Notice mein diye gaye time frame mein reply prepare karein" : "Prepare a reply within the timeframe mentioned",
        isHindi || isHinglish ? "Saare relevant documents aur evidence collect karein" : "Collect all relevant documents and evidence"
      ],
      legalReferences: [
        { name: "CPC", section: "Section 80", description: "Notice before suit against government" },
        { name: "Limitation Act", section: "Section 3", description: "Bar of limitation" },
        { name: "Constitution of India", section: "Article 14", description: "Right to equality before law" }
      ],
      disclaimer: isHindi || isHinglish
        ? "Yeh information sirf educational purposes ke liye hai. Professional legal advice ke liye ek qualified lawyer se consult karein."
        : "This information is for educational purposes only and should not be considered professional legal advice."
    };
  } else {
    // Default response
    response = {
      understanding: isHindi || isHinglish
        ? "Main aapki situation samajh raha hoon. Kuch aur details share karein taaki main better help kar sakoon."
        : "I understand your situation. Please share more details so I can provide better assistance.",
      explanation: isHindi || isHinglish
        ? "Aapka question kaafi important hai. Taaki main aapko best legal guidance de sakoon, kripya aur details batayein: kab hua, kahan hua, kisi witness the?"
        : "Your question is very important. To provide you with the best legal guidance, please share more details: when did this happen, where, and were there any witnesses?",
      actionableSteps: [
        isHindi || isHinglish ? "Incident ke saare details collect karein" : "Collect all details of the incident",
        isHindi || isHinglish ? "Relevant documents organize karein" : "Organize relevant documents",
        isHindi || isHinglish ? "Ek local lawyer se consult karein" : "Consult a local lawyer",
        isHindi || isHinglish ? "Legal aid services se contact karein agar affordable nahi hai" : "Contact legal aid services if unaffordable"
      ],
      legalReferences: [
        { name: "Constitution of India", section: "Article 14", description: "Right to equality before law" },
        { name: "Constitution of India", section: "Article 21", description: "Right to life and personal liberty" },
        { name: "Constitution of India", section: "Article 22", description: "Protection against arrest and detention" }
      ],
      disclaimer: isHindi || isHinglish
        ? "Yeh information sirf educational purposes ke liye hai. Professional legal advice ke liye ek qualified lawyer se consult karein."
        : "This information is for educational purposes only and should not be considered professional legal advice."
    };
  }

  // Build the full text content
  const fullContent = `${response.understanding}

${response.explanation}

What You Can Do:
${response.actionableSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

Relevant Legal References:
${response.legalReferences.map(ref => `- ${ref.name} ${ref.section}: ${ref.description}`).join("\n")}

${response.disclaimer}`;

  return { content: fullContent, structured: response };
}

export const chatRouter = createRouter({
  // Send a message and get AI response
  sendMessage: publicQuery
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Save user message
      await db.insert(messages).values({
        conversationId: input.conversationId,
        role: "user",
        content: input.content,
      });
      const rag = await retrieveRelevantContext(input.content);


      // Generate AI response
      const prompt = `
You are LawBot, an expert AI legal assistant for Indian law.

Use ONLY the legal context provided below.
If the context does not contain enough information, clearly say that more legal information is required.

========================
LEGAL KNOWLEDGE
========================

Source:
${rag.file}

${rag.context}

========================
USER QUESTION
========================

${input.content}

========================
INSTRUCTIONS
========================

- Reply in the user's language.
- Explain in simple language.
- Mention relevant Acts if available.
- Give practical next steps.
- Never invent legal sections.
- If information is unavailable, clearly say so.
- End with:
"This information is for educational purposes only and is not legal advice."
`;

      const geminiResult = await model.generateContent(prompt);

      const content = geminiResult.response.text();

      const structured = {
        understanding: "",
        explanation: content,
        actionableSteps: [],
        legalReferences: [],
        disclaimer:
          "This is educational information and not a substitute for professional legal advice.",
      };

      // Save AI message with structured content
      const result = await db.insert(messages).values({
        conversationId: input.conversationId,
        role: "assistant",
        content,
        structuredContent: JSON.stringify(structured),
      });

      const messageId = Number(result[0].insertId);
      const aiMessage = await db.query.messages.findFirst({
        where: eq(messages.id, messageId),
      });

      // Update conversation updatedAt
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      return aiMessage;
    }),

  // Get messages for a conversation
  getMessages: publicQuery
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);

      return result;
    }),
});
