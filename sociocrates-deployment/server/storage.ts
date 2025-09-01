import {
  users,
  circles,
  proposals,
  circleMemberships,
  stepTimings,
  clarifyingQuestions,
  quickReactions,
  objections,
  objectionResolutions,
  consentResponses,
  processLogs,
  type User,
  type InsertUser,
  type Circle,
  type InsertCircle,
  type Proposal,
  type InsertProposal,
  type ClarifyingQuestion,
  type InsertClarifyingQuestion,
  type QuickReaction,
  type InsertQuickReaction,
  type Objection,
  type InsertObjection,
  type ConsentResponse,
  type InsertConsentResponse,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

let db: any;

// Try to import the database, fall back to development storage if it fails
try {
  const dbModule = await import("./db");
  db = dbModule.db;
} catch (error) {
  console.warn("Database connection failed, using development storage:", error.message);
  db = null;
}

export interface IStorage {
  // Auth operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  validateUser(email: string, password: string): Promise<User | null>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Circle operations
  getAllCircles(): Promise<Circle[]>;
  getCircleById(id: string): Promise<Circle | undefined>;
  createCircle(circleData: InsertCircle): Promise<Circle>;
  getUserCircles(userId: string): Promise<Circle[]>;
  addUserToCircle(userId: string, circleId: string, role?: 'admin' | 'participant' | 'observer'): Promise<void>;
  
  // Proposal operations
  getProposalsByCircle(circleId: string): Promise<Proposal[]>;
  getProposalById(id: string): Promise<Proposal | undefined>;
  createProposal(proposalData: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposalData: Partial<Proposal>): Promise<Proposal | undefined>;
  
  // Process step operations
  addClarifyingQuestion(questionData: InsertClarifyingQuestion): Promise<ClarifyingQuestion>;
  getClarifyingQuestions(proposalId: string): Promise<ClarifyingQuestion[]>;
  addQuickReaction(reactionData: InsertQuickReaction): Promise<QuickReaction>;
  getQuickReactions(proposalId: string): Promise<QuickReaction[]>;
  addObjection(objectionData: InsertObjection): Promise<Objection>;
  getObjections(proposalId: string): Promise<Objection[]>;
  addConsentResponse(responseData: InsertConsentResponse): Promise<ConsentResponse>;
  getConsentResponses(proposalId: string): Promise<ConsentResponse[]>;
}

export class DatabaseStorage implements IStorage {
  // Auth operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not available");
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...userData, password: hashedPassword })
      .returning();
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    if (!db) throw new Error("Database not available");
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(users).orderBy(users.name);
  }

  async getAllCircles(): Promise<Circle[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(circles).orderBy(circles.name);
  }

  async getCircleById(id: string): Promise<Circle | undefined> {
    if (!db) throw new Error("Database not available");
    const [circle] = await db.select().from(circles).where(eq(circles.id, id));
    return circle;
  }

  async createCircle(circleData: InsertCircle): Promise<Circle> {
    if (!db) throw new Error("Database not available");
    const [circle] = await db.insert(circles).values(circleData).returning();
    return circle;
  }

  async getUserCircles(userId: string): Promise<Circle[]> {
    if (!db) throw new Error("Database not available");
    const result = await db
      .select({ circle: circles })
      .from(circleMemberships)
      .innerJoin(circles, eq(circleMemberships.circleId, circles.id))
      .where(eq(circleMemberships.userId, userId));
    
    return result.map(row => row.circle);
  }

  async addUserToCircle(userId: string, circleId: string, role: 'admin' | 'participant' | 'observer' = 'participant'): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.insert(circleMemberships).values({
      userId,
      circleId,
      role
    });
  }

  async getProposalsByCircle(circleId: string): Promise<Proposal[]> {
    if (!db) throw new Error("Database not available");
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.circleId, circleId))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposalById(id: string): Promise<Proposal | undefined> {
    if (!db) throw new Error("Database not available");
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }

  async createProposal(proposalData: InsertProposal): Promise<Proposal> {
    if (!db) throw new Error("Database not available");
    const [proposal] = await db.insert(proposals).values(proposalData).returning();
    return proposal;
  }

  async updateProposal(id: string, proposalData: Partial<Proposal>): Promise<Proposal | undefined> {
    if (!db) throw new Error("Database not available");
    const [proposal] = await db
      .update(proposals)
      .set({ ...proposalData, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return proposal;
  }

  async addClarifyingQuestion(questionData: InsertClarifyingQuestion): Promise<ClarifyingQuestion> {
    if (!db) throw new Error("Database not available");
    const [question] = await db.insert(clarifyingQuestions).values(questionData).returning();
    return question;
  }

  async getClarifyingQuestions(proposalId: string): Promise<ClarifyingQuestion[]> {
    if (!db) throw new Error("Database not available");
    return await db
      .select()
      .from(clarifyingQuestions)
      .where(eq(clarifyingQuestions.proposalId, proposalId))
      .orderBy(clarifyingQuestions.createdAt);
  }

  async addQuickReaction(reactionData: InsertQuickReaction): Promise<QuickReaction> {
    if (!db) throw new Error("Database not available");
    const [reaction] = await db.insert(quickReactions).values(reactionData).returning();
    return reaction;
  }

  async getQuickReactions(proposalId: string): Promise<QuickReaction[]> {
    if (!db) throw new Error("Database not available");
    return await db
      .select()
      .from(quickReactions)
      .where(eq(quickReactions.proposalId, proposalId))
      .orderBy(quickReactions.createdAt);
  }

  async addObjection(objectionData: InsertObjection): Promise<Objection> {
    if (!db) throw new Error("Database not available");
    const [objection] = await db.insert(objections).values(objectionData).returning();
    return objection;
  }

  async getObjections(proposalId: string): Promise<Objection[]> {
    if (!db) throw new Error("Database not available");
    return await db
      .select()
      .from(objections)
      .where(eq(objections.proposalId, proposalId))
      .orderBy(objections.createdAt);
  }

  async addConsentResponse(responseData: InsertConsentResponse): Promise<ConsentResponse> {
    if (!db) throw new Error("Database not available");
    const [response] = await db.insert(consentResponses).values(responseData).returning();
    return response;
  }

  async getConsentResponses(proposalId: string): Promise<ConsentResponse[]> {
    if (!db) throw new Error("Database not available");
    return await db
      .select()
      .from(consentResponses)
      .where(eq(consentResponses.proposalId, proposalId))
      .orderBy(consentResponses.createdAt);
  }
}

// Development storage with in-memory data
export class DevelopmentStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private circles: Map<string, Circle> = new Map();
  private proposals: Map<string, Proposal> = new Map();
  private memberships: Map<string, any> = new Map();
  private questions: Map<string, ClarifyingQuestion[]> = new Map();
  private reactions: Map<string, QuickReaction[]> = new Map();
  private objections: Map<string, Objection[]> = new Map();
  private responses: Map<string, ConsentResponse[]> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create admin user
    const adminId = nanoid();
    const admin: User = {
      id: adminId,
      email: "admin@sociocracy.org",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      name: "System Administrator",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminId, admin);

    // Create demo participant
    const participantId = nanoid();
    const participant: User = {
      id: participantId,
      email: "demo@sociocracy.org",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      name: "Demo Participant",
      role: "participant",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(participantId, participant);

    // Create default circle
    const circleId = nanoid();
    const circle: Circle = {
      id: circleId,
      name: "General Circle",
      description: "Main decision-making circle for collaborative governance",
      createdBy: adminId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.circles.set(circleId, circle);

    // Add users to circle
    this.memberships.set(`${adminId}-${circleId}`, { userId: adminId, circleId, role: 'admin' });
    this.memberships.set(`${participantId}-${circleId}`, { userId: participantId, circleId, role: 'participant' });

    // Create sample proposal
    const proposalId = nanoid();
    const proposal: Proposal = {
      id: proposalId,
      title: "Implement Flexible Work Hours Policy",
      description: "Proposal to allow team members to choose their working hours between 7 AM and 7 PM, with core collaboration hours from 10 AM to 3 PM.",
      circleId,
      createdBy: participantId,
      status: "active",
      currentStep: "clarifying_questions",
      stepStartTime: new Date(),
      stepEndTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.proposals.set(proposalId, proposal);

    this.questions.set(proposalId, []);
    this.reactions.set(proposalId, []);
    this.objections.set(proposalId, []);
    this.responses.set(proposalId, []);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user: User = {
      id: nanoid(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAllCircles(): Promise<Circle[]> {
    return Array.from(this.circles.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCircleById(id: string): Promise<Circle | undefined> {
    return this.circles.get(id);
  }

  async createCircle(circleData: InsertCircle): Promise<Circle> {
    const circle: Circle = {
      id: nanoid(),
      ...circleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.circles.set(circle.id, circle);
    return circle;
  }

  async getUserCircles(userId: string): Promise<Circle[]> {
    const userCircleIds = Array.from(this.memberships.values())
      .filter(m => m.userId === userId)
      .map(m => m.circleId);
    
    return userCircleIds.map(id => this.circles.get(id)).filter(Boolean) as Circle[];
  }

  async addUserToCircle(userId: string, circleId: string, role: 'admin' | 'participant' | 'observer' = 'participant'): Promise<void> {
    this.memberships.set(`${userId}-${circleId}`, { userId, circleId, role });
  }

  async getProposalsByCircle(circleId: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values())
      .filter(p => p.circleId === circleId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProposalById(id: string): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async createProposal(proposalData: InsertProposal): Promise<Proposal> {
    const proposal: Proposal = {
      id: nanoid(),
      ...proposalData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.proposals.set(proposal.id, proposal);
    
    // Initialize empty arrays for this proposal
    this.questions.set(proposal.id, []);
    this.reactions.set(proposal.id, []);
    this.objections.set(proposal.id, []);
    this.responses.set(proposal.id, []);
    
    return proposal;
  }

  async updateProposal(id: string, proposalData: Partial<Proposal>): Promise<Proposal | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;
    
    const updatedProposal = { ...proposal, ...proposalData, updatedAt: new Date() };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  async addClarifyingQuestion(questionData: InsertClarifyingQuestion): Promise<ClarifyingQuestion> {
    const question: ClarifyingQuestion = {
      id: nanoid(),
      ...questionData,
      createdAt: new Date(),
    };
    
    const questions = this.questions.get(questionData.proposalId) || [];
    questions.push(question);
    this.questions.set(questionData.proposalId, questions);
    
    return question;
  }

  async getClarifyingQuestions(proposalId: string): Promise<ClarifyingQuestion[]> {
    return this.questions.get(proposalId) || [];
  }

  async addQuickReaction(reactionData: InsertQuickReaction): Promise<QuickReaction> {
    const reaction: QuickReaction = {
      id: nanoid(),
      ...reactionData,
      createdAt: new Date(),
    };
    
    const reactions = this.reactions.get(reactionData.proposalId) || [];
    reactions.push(reaction);
    this.reactions.set(reactionData.proposalId, reactions);
    
    return reaction;
  }

  async getQuickReactions(proposalId: string): Promise<QuickReaction[]> {
    return this.reactions.get(proposalId) || [];
  }

  async addObjection(objectionData: InsertObjection): Promise<Objection> {
    const objection: Objection = {
      id: nanoid(),
      ...objectionData,
      createdAt: new Date(),
    };
    
    const objections = this.objections.get(objectionData.proposalId) || [];
    objections.push(objection);
    this.objections.set(objectionData.proposalId, objections);
    
    return objection;
  }

  async getObjections(proposalId: string): Promise<Objection[]> {
    return this.objections.get(proposalId) || [];
  }

  async addConsentResponse(responseData: InsertConsentResponse): Promise<ConsentResponse> {
    const response: ConsentResponse = {
      id: nanoid(),
      ...responseData,
      createdAt: new Date(),
    };
    
    const responses = this.responses.get(responseData.proposalId) || [];
    responses.push(response);
    this.responses.set(responseData.proposalId, responses);
    
    return response;
  }

  async getConsentResponses(proposalId: string): Promise<ConsentResponse[]> {
    return this.responses.get(proposalId) || [];
  }
}

// Export appropriate storage based on environment
export const storage: IStorage = db ? new DatabaseStorage() : new DevelopmentStorage();
