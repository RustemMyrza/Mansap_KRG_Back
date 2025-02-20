const soapMethods = {
    NomadOperatorQueueList: {
        name: 'NomadOperatorQueueList',
        args: {
            "cus:NomadOperatorQueueList_Input": {
                "cus:SessionIdQueueList": "?" // Укажи нужный SessionId
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    },
    NomadWebMenuList: {
        name: 'NomadWebMenuList',
        args:  {
            "cus:NomadWebMenuList_Input": {
                "cus:ParentQueueId": "?",
                "cus:BranchQueueId": "3"
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    },
    NomadTerminalBranchList: {
        name: 'NomadTerminalBranchList',
        args: {
            "cus:NomadTerminalBranchList_Input": {
                "cus:BranchList": "?"
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    },
    NomadOperatorList: (queueId, branchId) => ({
        name: 'NomadOperatorList',
        args: {
            'cus:NomadOperatorList_Input': {
                'cus:OperatorQueueId': Number(queueId),
                'cus:BranchId': Number(branchId)
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    }),
    NomadTerminalEvent_Now2: (queueId, iin, phoneNum, branchId, local) => ({
        name: 'NomadTerminalEvent_Now2',
        args: {
            'cus:NomadTerminalEvent_Now2_Input': {
                'cus:QueueId_Now2': queueId,
                'cus:IIN': iin,
                'cus:Phone': phoneNum,
                'cus:BranchId': branchId,
                'cus:channel': 'web',
                'cus:local': local,
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    }),
    NomadTerminalEvent_Now: (queueId, iin, branchId, local) => ({
        name: 'NomadTerminalEvent_Now',
        args: {
            'cus:NomadTerminalEvent_Now_Input': {
                'cus:QueueId_Now': queueId,
                'cus:IIN': iin,
                'cus:BranchId': branchId,
                'cus:channel': 'web',
                'cus:local': local,
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    }),
    NomadEvent_Info: (eventId, branchId) => ({
        name: 'NomadEvent_Info',
        args: {
            'cus:NomadEvent_Info_Input': {
                'cus:EventId': eventId,
                'cus:BranchId': branchId
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    }),
    NomadOperatorMissed: (eventId) => ({
        name: 'NomadOperatorMissed',
        args: {
            'cus:NomadOperatorMissed_Input': {
                'cus:EventIdMissed': eventId
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    }),
    NomadBranchWindowList: (branchId) => ({
        name: 'NomadBranchWindowList',
        args: {
            'cus:NomadBranchWindowList_Input': {
                'cus:BranchIdWindowList': branchId
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    }),
    NomadAllTicketList: {
        name: 'NomadAllTicketList',
        args: {
            "cus:NomadAllTicketList_Input": {
                "cus:SessionIdAllTicket": "?" // Укажи нужный SessionId
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    },
    NomadTerminalTicketRatingOrder: (orderId, rating) => ({
        name: 'NomadTerminalTicketRatingOrder',
        args: {
            'cus:NomadTerminalTicketRatingOrder_Input': {
                'cus:EventRatingOrder': orderId,
                'cus:Rating': rating
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    })
};

export default soapMethods;
