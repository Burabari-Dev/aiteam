export namespace main {
	
	export class Message {
	    role: string;
	    agentName?: string;
	    content: string;
	    timestamp: string;
	    mentions?: string[];
	
	    static createFrom(source: any = {}) {
	        return new Message(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.role = source["role"];
	        this.agentName = source["agentName"];
	        this.content = source["content"];
	        this.timestamp = source["timestamp"];
	        this.mentions = source["mentions"];
	    }
	}
	export class Meeting {
	    id: string;
	    title: string;
	    startedAt: string;
	    endedAt: string;
	    agents: string[];
	    agentSessions: Record<string, string>;
	    messages: Message[];
	
	    static createFrom(source: any = {}) {
	        return new Meeting(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.startedAt = source["startedAt"];
	        this.endedAt = source["endedAt"];
	        this.agents = source["agents"];
	        this.agentSessions = source["agentSessions"];
	        this.messages = this.convertValues(source["messages"], Message);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MeetingSummary {
	    id: string;
	    title: string;
	    startedAt: string;
	    agentCount: number;
	
	    static createFrom(source: any = {}) {
	        return new MeetingSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.startedAt = source["startedAt"];
	        this.agentCount = source["agentCount"];
	    }
	}
	
	export class ProjectMeta {
	    name: string;
	    description: string;
	    createdAt: string;
	    teamRoles: string[];
	
	    static createFrom(source: any = {}) {
	        return new ProjectMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.createdAt = source["createdAt"];
	        this.teamRoles = source["teamRoles"];
	    }
	}
	export class ProjectRegistryEntry {
	    name: string;
	    path: string;
	    lastOpened: string;
	
	    static createFrom(source: any = {}) {
	        return new ProjectRegistryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.lastOpened = source["lastOpened"];
	    }
	}
	export class RoleTemplate {
	    name: string;
	    label: string;
	    description: string;
	    context: string;
	
	    static createFrom(source: any = {}) {
	        return new RoleTemplate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.label = source["label"];
	        this.description = source["description"];
	        this.context = source["context"];
	    }
	}

}

