import React from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface FAQsProps {
    jamiahMode?: boolean;
}

export const FAQs: React.FC<FAQsProps> = ({ jamiahMode = false }) => {
    const defaultFaqs = [
        {
            question: "Was ist der Zweck dieser Plattform?",
            answer:
                "Diese Plattform ist darauf ausgelegt, Ihnen ein effizientes Management Ihrer privaten Risiken zu ermöglichen. Sie bietet Werkzeuge und Ressourcen, die Sie bei der Bewertung, Überwachung und Minimierung von Risiken unterstützen."
        },
        {
            question: "Wie kann ich diese Plattform nutzen?",
            answer:
                "Um diese Plattform zu nutzen, müssen Sie sich zunächst registrieren und einloggen. Nach der Registrierung können Sie Ihr Risikoprofil anlegen und die verschiedenen Funktionen zur Risikoverwaltung nutzen."
        }
    ];

    const jamiahFaqs = [
        {
            question: "Was ist eine digitale Jamiah?",
            answer:
                "Eine Jamiah ist eine gemeinschaftsbasierte Finanzierungslösung. Digitalisiert bedeutet dies: alle Mitglieder, Beiträge, Entscheidungen und Abläufe sind online einseh- und verwaltbar."
        },
        {
            question: "Wie funktioniert die Beitragserhebung?",
            answer:
                "Beiträge werden monatlich oder wie vereinbart digital eingezogen und transparent auf dem Jamiah-Dashboard dargestellt."
        },
        {
            question: "Wer kann meine Jamiah sehen?",
            answer:
                "Nur autorisierte Mitglieder deiner Gruppe haben Einsicht. Die Plattform sorgt für Datenschutz und Zugriffskontrolle."
        },
        {
            question: "Kann ich mehrere Gruppen gleichzeitig verwalten?",
            answer:
                "Ja, du kannst mehrere Jamiahs gleichzeitig über dasselbe Nutzerkonto betreuen."
        },
        {
            question: "Wie sicher sind meine Daten?",
            answer:
                "Alle Daten werden verschlüsselt gespeichert und über sichere Verbindungen übertragen."
        }
    ];

    const faqs = jamiahMode ? jamiahFaqs : defaultFaqs;
    const [expanded, setExpanded] = React.useState<string | false>(false);

    const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <div style={{ margin: "50px" }}>
            <Typography variant="h3" style={{ textAlign: "center", marginBottom: "50px" }}>
                Antworten auf deine Fragen
            </Typography>
            {faqs.map((faq, index) => (
                <Accordion
                    key={index}
                    style={{ marginTop: "20px" }}
                    expanded={expanded === `panel${index}`}
                    onChange={handleChange(`panel${index}`)}
                    elevation={0}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1bh-content"
                        id={`panel${index}`}
                    >
                        <Typography variant="h6" sx={{ width: "33%", flexShrink: 0, color: "text.secondary" }}>
                            {faq.question}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>{faq.answer}</Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </div>
    );
};
