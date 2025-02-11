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
    }
}

export default responseHandlers;