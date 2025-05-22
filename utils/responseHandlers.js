import writeToLog from "../Log/toLog.js";

const responseHandlers = {
    serviceList: (data) => {
        const services = data['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadOperatorQueueList'][0]['xsd:complexType'][1]['xsd:element'];
        
        const allStructuredServices = services.map(service => ({
            queueId: service['$']['queueId'],
            parentId: service['$']['parentId'],
            workName: service['$']['workName'],
            type: service['$']['type'],
            children: []
        }));
    
        return allStructuredServices;
    },

    availableServiceList: (serviceList) => {
        writeToLog(serviceList);
        const services = serviceList['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadTerminalMenuList'][0]['xsd:complexType'][1]['xsd:element'];
        if (services) {
            const transformedServices = services.map(service => {
                const workNames = service["$"].workName.split(';').reduce((acc, item) => {
                        const [lang, name] = item.split('=');
                        if (lang && name) acc[lang.toLowerCase()] = name.trim();
                        return acc;
                    }, {});

                    return {
                        queueId: parseInt(service["$"].queueId, 10),
                        parentId: parseInt(service["$"].parentId, 10),
                        name_en: workNames['en'] || '',
                        name_ru: workNames['ru'] || '',
                        name_kz: workNames['kz'] || '',
                        children: []
                    };
            });

            const tree = [
                {
                    "queueId": 1005,
                    "parentId": null,
                    "children": buildTree(transformedServices, 1005)
                }
            ]
            return tree;
        } else {
            console.error('There is no services');
            return false;
        }

        // Построение дерева
        function buildTree(items, rootId) {
            const lookup = new Map();
            const roots = [];

            // Индексируем элементы по queueId
            items.forEach(item => {
                lookup.set(item.queueId, item);
            });

            // Привязываем дочерние элементы к родителям
            items.forEach(item => {
                if (item.parentId === rootId) {
                    roots.push(item); // Корневой уровень
                } else {
                    const parent = lookup.get(item.parentId);
                    if (parent) {
                        parent.children.push(item);
                    }
                }
            });

            return roots;
        }

        const tree = [
            {
                "queueId": 1005,
                "parentId": null,
                "children": buildTree(transformedServices, 1005)
            }
        ]
        return tree;
    },

    availableOperators: (operatorList) => {
        const operators = operatorList['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadOperatorList'][0]['xsd:complexType'][1]['xsd:element'];
        if (typeof operators !== "undefined") {
            const structuredOperators = operators.map(operator => ({
                operatorId: operator['$']['operatorId'],
                name: operator['$']['workName']
            }));
            return structuredOperators;
        } else {
            return [];
        }
    },

    getTicket: (data) => {
        const ticketData = data['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadTerminalEvent_Now'][0];
        const structuredTicketData = ({
            eventId: ticketData['cus:eventId'][0],
            ticketNo: ticketData['cus:TicketNo'][0],
            startTime: ticketData['cus:StartTime'][0],
            serviceName: ticketData['cus:ServiceName'][0],
            orderNum: ticketData['cus:OrderNum'][0],
            proposalTime: ticketData['cus:ProposalTime'][0]
        })
        return structuredTicketData;
    },

    ticketInfo: async (ticketInfo) => {
        ticketInfo = await ticketInfo;
        const parsedTicketInfo = ticketInfo['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadTicketInfo'][0]['xsd:element'][0]['$'];
        return parsedTicketInfo;
    },
    branchList: (xmlBranchList) => {
        const branchList = xmlBranchList['soapenv:Envelope']["soapenv:Body"][0]['cus:NomadWindowList'][0]["xsd:complexType"][1]["xsd:element"];
        const structuredBranchList = branchList.map(branchData => ({
            windowId: branchData['$']["WindowId"],
            operatorId: branchData['$']["OperatorId"],
            no: branchData['$']["No"],
            role: branchData['$']["Role"],
        }))
        return structuredBranchList;
    },
    newTicketList: (xmlTicketList) => {
        const ticketList = xmlTicketList["soapenv:Envelope"]["soapenv:Body"][0]["cus:NomadAllTicketList"][0]["xsd:complexType"][1]["xsd:element"];
        const structuredTicketList = ticketList
            .filter(ticket => ["NEW", "INSERVICE"].includes(ticket['$']['State']))
            .map(ticket => {
                ticket = ticket['$'];
                return ticket;
            });
        const sortedStructuredTicketList = structuredTicketList.sort((a, b) => Number(a.StartTime) - Number(b.StartTime));
        return sortedStructuredTicketList;
    },
    ticketList: (xmlTicketList) => {
        const ticketList = xmlTicketList["soapenv:Envelope"]["soapenv:Body"][0]["cus:NomadAllTicketList"][0]["xsd:complexType"][1]["xsd:element"];
        return ticketList;
    },
    redirectedTicket: (newTicketList, ticketInfo) => {
        console.log('newTicketList:', newTicketList);
        const redirectedTicket = newTicketList.find(ticket => (
            ticket.TicketNo == ticketInfo.TicketNo &&
            ticket.Redirected == "true"
        ));
        return redirectedTicket || null;
    },
    eventCancel: (xmlCancelResult) => {
        const resultData = xmlCancelResult['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadTerminalEvent_Output'][0];
        return resultData;
    }
}

export default responseHandlers;