import React from "react";
import {Accordion, AccordionDetails, AccordionSummary, Typography} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export const FAQs = () => {
    const faqs: { question: string, answer: string }[] = [
        {
            question: "Was ist der Zweck dieser Plattform?",
            answer: "Diese Plattform ist darauf ausgelegt, Ihnen ein effizientes Management Ihrer privaten Risiken zu ermöglichen. Sie bietet Werkzeuge und Ressourcen, die Sie bei der Bewertung, Überwachung und Minimierung von Risiken unterstützen."
        },
        {
            question: "Wie kann ich diese Plattform nutzen?",
            answer: "Um diese Plattform zu nutzen, müssen Sie sich zunächst registrieren und einloggen. Nach der Registrierung können Sie Ihr Risikoprofil anlegen und die verschiedenen Funktionen zur Risikoverwaltung nutzen."
        },
        {
            question: "Wie kann ich Hilfe erhalten?",
            answer: "Sie können Hilfe erhalten, indem Sie unser Support-Team über das bereitgestellte Kontaktformular auf unserer Webseite kontaktieren. Unser Team steht Ihnen für alle Fragen zur Verfügung und hilft Ihnen gerne weiter."
        },
        {
            question: "Wie kann ich einen Fehler melden?",
            answer: "Wenn Sie einen technischen Fehler auf der Plattform entdecken, können Sie diesen unserem Support-Team melden. Nutzen Sie dafür bitte das spezielle Formular für Fehlermeldungen auf unserer Webseite, damit wir den Fehler schnellstmöglich beheben können."
        },
        {
            question: "Welche Arten von Risiken kann ich auf dieser Plattform managen?",
            answer: "Die Plattform unterstützt das Management einer Vielzahl von privaten Risiken, einschließlich finanzieller, rechtlicher und persönlicher Sicherheitsrisiken. Sie können spezifische Risikoszenarien erstellen und verwalten, die auf Ihre individuellen Bedürfnisse zugeschnitten sind."
        },
        {
            question: "Gibt es eine mobile App für diese Plattform?",
            answer: "Ja, wir bieten eine mobile Anwendung an, die Sie auf Ihr Smartphone herunterladen können. Diese App bietet Ihnen die Möglichkeit, Ihre Risiken auch unterwegs zu managen und sich über Risikoaktualisierungen in Echtzeit informieren zu lassen."
        },
        {
            question: "Wie werden meine Daten auf dieser Plattform geschützt?",
            answer: "Ihre Daten werden mit modernsten Sicherheitstechnologien geschützt. Wir verwenden SSL-Verschlüsselung für alle Datenübertragungen und speichern Ihre Daten auf sicheren Servern. Datenschutz und -sicherheit sind für uns von höchster Priorität."
        },
        {
            question: "Kann ich die Plattform vor der Registrierung testen?",
            answer: "Ja, wir bieten eine Demo-Version der Plattform an, die Sie nutzen können, um sich mit den Funktionen und dem Interface vertraut zu machen, bevor Sie sich registrieren. Besuchen Sie unsere Webseite, um Zugang zur Demo zu erhalten."
        }
    ]

    const [expanded, setExpanded] = React.useState<string | false>(false);

    const handleChange =
        (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false);
        };

    return (
        <div style={{margin: "50px"}}>
            <Typography variant="h3" style={{textAlign: "center", marginBottom: "50px"}}>
                Antworten auf deine Fragen
            </Typography>

            {
                faqs.map((faq, index) => (
                    <Accordion
                        key={index}
                        style={{marginTop: "20px"}}
                        expanded={expanded === `panel${index}`}
                        onChange={handleChange(`panel${index}`)}
                        elevation={0}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                            aria-controls="panel1bh-content"
                            id="panel1bh-header">
                            <Typography variant="h6" sx={{width: '33%', flexShrink: 0, color: 'text.secondary'}}>
                                {faq.question}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                {faq.answer}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                ))
            }
        </div>
    );
}
