const responseHandlers = {
    serviceList: (data) => {
        const services = data['soapenv:Envelope']['soapenv:Body'][0]['cus:NomadOperatorQueueList'][0]['xsd:complexType'][1]['xsd:element'];
        const structuredServices = services.map(service => ({
            queueId: service['$']['queueId'],
            parentId: service['$']['parentId'],
            workName: service['$']['workName'],
            children: []
        }));
        
        const serviceMap = structuredServices.reduce((acc, service) => {
            acc[service.queueId] = service;
            return acc;
        }, {});
    
        const serviceTree = [];
    
        // Строим дерево
        structuredServices.forEach(service => {
            if (service.parentId === 'null') {
                serviceTree.push(service); // Если это корень, добавляем в дерево
            } else {
                const parent = serviceMap[service.parentId];
                if (parent) {
                    parent.children.push(service); // Если родитель найден, добавляем в children
                }
            }
        });
    
        return serviceTree;
    }
}

export default responseHandlers;