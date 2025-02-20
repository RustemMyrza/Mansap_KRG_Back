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

    webServiceList: (webList, allData = null) => {
        const webServices = webList['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadWebMenuList'][0]['WebQueueList'];
        
        // console.log('allData:', allData);
        const structuredWebServices = webServices.map(service => ({
            queueId: service['$']['queueId'],
            parentId: service['$']['parentId'],
            workName: service['$']['workName'],
            type: service['$']['type'],
            children: []
        }   ));

        console.log('servicesMap:', servicesMap);
        console.log(typeof servicesMap);

        servicesMap.forEach(element => {
            console.log('element:', element);
        });

        console.log('servicesMap:', servicesMap);

        return tree;
    },

    availableOperators: (operatorList) => {
        const operators = operatorList['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadOperatorList'][0]['xsd:complexType'][1]['xsd:element'];
        const structuredOperators = operators.map(operator => ({
            operatorId: operator['$']['operatorId'],
            name: operator['$']['workName']
        }))
        return structuredOperators;
    },

    getTicket: (data) => {
        const ticketData = data['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadTerminalEvent_Now'][0];
        console.log('ticketData:', ticketData);
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
            .filter(ticket => ticket['$']['State'] == 'NEW')
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
            ticket.Redirected == "true" &&
            ticket.AdditionalStatus == "2"
        ));
        return redirectedTicket || null;
    }
}

export default responseHandlers;