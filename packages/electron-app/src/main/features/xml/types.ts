export interface XMLJSONData {
  "?xml": string;
  EInvoice: {
    Header: {
      EIid: string;
      EInvoiceTag: string;
      Version: number;
      InherentLabel: {
        InIssuType: {
          LabelCode: string;
          LabelName: string;
        };
        EInvoiceType: {
          LabelCode: number | string;
          LabelName: string;
        };
        GeneralOrSpecialVAT: {
          LabelCode: number | string;
          LabelName: string;
        };
      };
      UndefinedLabel: {
        Label: {
          LabelType: string;
          LabelCode: number | string;
          LabelName: string;
        };
      };
    };
    EInvoiceData: {
      SellerInformation: {
        SellerIdNum: string;
        SellerName: string;
        SellerAddr: string;
        SellerTelNum: string;
        SellerBankName: string;
        SellerBankAccNum: string | number;
      };
      BuyerInformation: {
        BuyerIdNum: string;
        BuyerName: string;
        BuyerBankName: string;
        BuyerBankAccNum: string | number;
        BuyerAddr: string;
        BuyerTelNum: string;
      };
      BasicInformation: {
        TotalAmWithoutTax: number;
        TotalTaxAm: number;
        "TotalTax-includedAmount": number;
        "TotalTax-includedAmountInChinese": string;
        Drawer: string;
        RequestTime: string;
      };
      IssuItemInformation: IssuItemInformation[] | IssuItemInformation;
      SpecificInformation: {
        PassengerTransportation: Array<{
          Departure: string;
          Destination: string;
          Traveler: string;
          ValidIDNumber: string;
          TravelDate: string;
          Grade: string;
          TypeOfPassengerDocument: string;
          Vehicletype: string;
        }>;
      };
      AdditionalInformation:
        | string
        | {
            Remark: string;
          };
    };
    SellerAuthentication: {
      AuthenticationMethods: number | string;
    };
    TaxSupervisionInfo: {
      InvoiceNumber: string;
      IssueTime: string;
      TaxBureauCode: string | number;
      TaxBureauName: string;
    };
  };
}

export interface IssuItemInformation {
  ItemName: string;
  SpecMod: string;
  MeaUnits: string;
  Quantity: number;
  UnPrice: number;
  Amount: number;
  TaxRate: number;
  ComTaxAm: number;
  TotaltaxIncludedAmount: number;
  TaxClassificationCode: string | number;
}

export interface Invoice {
  id: string;
  totalTaxIncludedAmount: string;
  requestTime: string;
  filePath: string;
  itemName?: string;
  additionalInformation?: string;
  pdf: boolean;
  xml: boolean;
}

export interface IPCContract {
  "XML/XML": {
    args: [string];
    return: XMLJSONData;
  };
  "XML/SELECT_XML_PDF_FROM_FOLDER": {
    args: [string[]];
    return: string[];
  };
  "XML/XML_PDF_COMPUTE": {
    args: [string[]];
    return: Invoice[];
  };
}
