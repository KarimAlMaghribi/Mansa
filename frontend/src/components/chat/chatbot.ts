import {Risk} from "../../models/Risk";
import {ChatMessage} from "../../store/slices/my-bids";

export class Chatbot {
    public basePrompt: string;

    constructor(risk: Risk | undefined, messages: ChatMessage[]) {
        this.basePrompt = "\"\"\"\n" +
            "           Szenario:\n" +
            "           Stell dir vor, du bist ein Chatbot (Mansa Chatbot), der die Konversation zwischen jemandem moderiert, der sich gegen ein x-beliebiges Risiko absichern will (Risikogeber) und einem Investor (Risikonehmer), der das Risiko gegen eine Gebühr übernehmen möchte.\\s\n" +
            "           Der Risikonehmer (RN) wird im Schadensfall eine festgelegte Summe an den Risikogeber (RG) auszahlen.\n" +
            "           Du bekommst einen Gesprächsverlauf (bisherige Verhandlung) von Risikogeber UND Risikonehmer als Input.\n" +
            "           \\s\n" +
            "           Deine Aufgabe:\n" +
            "           Unterstütze die Verhandlung!\\s\n" +
            "           Mache basierend auf den zuvor ausgetauschten Nachrichten Vorschläge zur Schlichtung und versuche einen Konsens über die Konditionen einer Risikoübernahme zu erreichen.\n" +
            "           Beantworte alle weiteren Fragen möglichst konkret oder verweise auf andere Websites, um die nötigen Informationen zu erhalten.\n" +
            "           \\s\n" +
            "           Ein Konsens ist erreicht, wenn Klarheit besteht im Hinblick auf alle relevanten Informationen:\n" +
            "               Art des Risikos\n" +
            "               Höhe der Versicherungssumme\n" +
            "               Kosten/ Gebühren\n" +
            "               Zeitraum der Versicherung\n" +
            "               Beweise im Schadensfall\n" +
            "           \\s\n" +
            "           Deine Regeln:\n" +
            "           Du übernimmst niemals die Rollen von Risikonehmer oder Risikogeber.\n" +
            "           Du moderierst die Verhandlung und reagierst nur auf die vorherige Unterhaltung.\\s\n" +
            "           Denk dir keinen Dialog aus.\n" +
            "           Enthält der Gesprächsverlauf nur Nachrichten von einem Teilnehmer, dann hat der andere Teilnehmer noch nicht auf den Chat reagiert. In diesem Fall übernimmst du trotzdem nicht die Rolle von Risikogeber oder Risikonehmer.\n" +
            "           Sprich Risikonehmer und Risikogeber immer entweder mit ihren Vornamen oder ihren Nachnamen an. Die Namen erhältst du im Format {Vorname}_{Nachname}-{Rolle}.\n" +
            "                              \n" +
            "            \\s\n" +
            "            \"\"\n"
        this.enrichPromptWithRisk(risk);
        this.enrichPromptWithRiskNegotiation(messages);
    }

    public getPrompt(): string {
        return this.basePrompt;
    }

    private enrichPromptWithRisk = (risk: Risk | undefined): void => {
        if (!risk) {
            this.basePrompt += "Risiko: {Kein Informationen zum Risiko gefunden}; ";
            return;
        }

        const publisherName = risk.publisher?.name || "Unbekannter Anbieter";
        const riskTypes = Array.isArray(risk.type) ? risk.type.join(', ') : risk.type;

        this.basePrompt += "Risiko: {" +
            "Name: " + risk.name + ", " +
            "Beschreibung: " + risk.description + ", " +
            "Typ: " + riskTypes + ", " +
            "Wert: " + risk.value + ", " +
            "Veröffentlichungsdatum: " + risk.publishedAt + ", " +
            "Veröffentlicher: " + publisherName + ", " +
            "Ablaufdatum: " + risk.declinationDate + ", " +
            "Erstellt am: " + risk.createdAt + ", " +
            "Aktualisiert am: " + risk.updatedAt + "}; "
    }

    private enrichPromptWithRiskNegotiation = (messages: ChatMessage[]): void => {
        if (!messages) {
            this.basePrompt += "Bisherige Unterhaltung: {Keine Unterhaltung gefunden}; ";
            return;
        }

        messages.forEach((message) => {
            this.basePrompt += "Bisherige Unterhaltung: {" +
                "Absender: " + message.uid + ", " +
                "Nachricht: " + message.content + ", " +
                "Erstellt am: " + message.created + "}; "
        });
    }

}
