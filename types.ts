export enum Status {
  Available = 'Available',
  Reserved = 'Reserved',
  Sold = 'Sold',
}

export enum ClientStatus {
  Active = 'ACTIVO',
  Inactive = 'INACTIVO',
}

export enum ClientType {
  Interested = 'Interesado',
  Potential = 'Potencial',
  OptionHolder = 'Optante',
  Partner = 'Socio',
  Previous = 'Previo',
  Reserved = 'Reserva',
  Buyer = 'Comprada',
}

export interface Client {
  // --- Identificadores ---
  id: string; // idC

  // --- Estado Comercial ---
  status: ClientStatus;
  clientType: ClientType;
  group?: string;

  // --- Datos Personales ---
  name: string; // nombre
  lastName?: string; // apellidos
  dni?: string;
  phone: string; // telefono1
  phone2?: string; // telefono2
  email: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
  birthDate?: string; // Formato ISO "YYYY-MM-DD"
  civilStatus?: string;
  gender?: 'F' | 'M';

  // --- Datos de Control ---
  registrationDate: string; // fechaRegistro (Formato ISO)
  lastActivityDate?: string; // fechaUltimaActividad (Formato ISO)
  notes?: string;
}

export interface AugmentedClient extends Client {
  idC: string;
  // Vínculos
  promocionId?: string;
  promocionNombre?: string;
  viviendaId?: string;
  garajeId?: string;
  trasteroId?: string;
  // Campos calculados
  edad?: number;
  rangoEdad?: string;
  añoRegistro?: number;
}

// FIX: Exported the FiltersState interface to resolve import errors across multiple components.
export interface FiltersState {
  building: string;
  floor: string;
  bedrooms: string;
  status: string;
  type: string;
  position: string;
  orientation: string;
  priceRange: string;
}

export interface Garage {
  id: string; // ID-G
  linkedStorageId?: string; // TRASTERO VINC
  builtArea: number; // CONST-G
  usefulArea: number; // ÚTIL PRIV-G
  price: number; // PRECIO MÁX-G
  type: string; // TIPO-G
  // [NUEVO] Firma de índice para permitir propiedades dinámicas del CSV
  [key: string]: any;
}

export interface Storage {
  id: string; // ID-T
  linkedGarageId?: string; // PLAZA VINCULADA
  builtArea: number; // CONST-T
  usefulArea: number; // ÚTIL PRIV-T
  price: number; // PRECIO MÁX-T
  // [NUEVO] Firma de índice para permitir propiedades dinámicas del CSV
  [key: string]: any;
}

export interface Unit {
  id: string; // VIVIENDAS
  bedrooms: number; // Nº DORM
  bathrooms: number; // Nº BAÑOS
  building: string; // EDIFICIO
  floor: number; // NIVEL
  type: string; // TIPO
  position: string; // POSICIÓN
  orientation: string; // ORIENTACIÓN
  
  // Useful Areas (from original implementation)
  surfaceEntrance: number;
  surfaceDistributor: number;
  surfaceLivingDiningKitchen: number;
  surfaceLaundry: number;
  surfaceBedroom1: number;
  surfaceBedroom2: number;
  surfaceBedroom3: number;
  surfaceBedroom4: number;
  surfaceBathroom1: number;
  surfaceBathroom2: number;
  
  // Expanded Useful Areas from TS GENERAL
  usefulLivingArea: number; // SUP. ÚTIL VIVIENDDA
  usefulCoveredTerrace: number; // SUP. ÚTIL TERRAZA CUB.
  usefulUncoveredTerrace: number; // SUP. ÚTIL TERRAZA DESC.
  totalUsefulArea: number; // SUP. ÚTIL TOTAL

  // Expanded Built Areas from TS GENERAL
  builtLivingArea: number; // SUP. CONST. VIVIENDA
  builtCommonArea: number; // SUP. CONST. Z.C.
  totalBuiltArea: number; // SUP. CONST. TOTAL

  // Original built areas, might be redundant or different calculation
  netArea: number; // NETA
  totalBuiltWithCommon: number; // NETA+ZC/C.NETA
  terraceArea: number; // TOTAL EXT REAL
  
  status: Status;
  price: number; // PRECIO DE Venta (was MÁXIMO)
  
  // Linked items
  garageId?: string;
  storageId?: string;
  buyerId?: string;
  notes?: string;

  // New fields for time-based analysis
  reservationDate?: string;
  saleDate?: string;

  // [NUEVO] Firma de índice para permitir propiedades dinámicas del CSV
  [key: string]: any;
}


export interface Project {
  id: string;
  name: string;
  
  // Fields from DS GENERALES
  code?: string;
  regime?: string;
  modality?: string;
  location?: string;
  promoter?: string;
  architect?: string;
  constructor?: string;
  plotArea?: number;
  maxEdificability?: number;
  totalSaleValue?: number;
  constructionCost?: number;
  pemProject?: number;

  // NEW FIELDS from DS GENERALES
  // Section 1
  locality?: string;
  use?: string;
  typology?: string;
  workType?: string;
  projectPhase?: string;
  managementSystem?: string;

  // Section 2
  maxDwellings?: number;
  minGarageSpaces?: number;
  commercialPremises?: number;
  maxFloorsSR?: number;
  floorsBR?: number;

  // Section 5: Agentes
  property?: string;
  studio?: string;
  technicalArchitect1?: string;
  technicalArchitect2?: string;
  marketer?: string;
  commercialDocs?: string;
  infographics?: string;
  materialsManager?: string;

  // Section 4: Project Management
  projectManagement?: string;
  projectMonitoring?: string;
  headOfWorks?: string;
  worksManager?: string;
  geotechnical?: string;
  topographical?: string;
  ict?: string;
  oct?: string;
  decennialInsurance?: string;

  // Section 10: Datos Económicos
  pemContracted?: number;
  urbanizationCosts?: number;
  icio?: number;
  licenseFees?: number;
  residualDeposit?: number;
  urbanizationDeposit?: number;
  
  // Bottom section fields
  pemUnitCoacResidential?: number;
  pemUnitCoacCommercial?: number;
  pemUnitCoacUrbInterior?: number;
  pemUnitCoacParking?: number;
  pemUsoSupProjectResidential?: number;
  pemUsoSupProjectCommercial?: number;
  pemUsoSupProjectUrbInterior?: number;
  pemUsoSupProjectParking?: number;
  pemUsoPemUsoResidential?: number;
  pemUsoPemUsoCommercial?: number;
  pemUsoPemUsoUrbInterior?: number;
  pemUsoPemUsoParking?: number;
  pemTotal?: number;
  iprem?: string;
  regime2?: string;
  maximos2025?: string;
  precioLimitado?: string;
  moduloBasico?: number;
  moduloPonderado?: number;
  precioReferencia?: number;
  precioRefAnejos?: number;
  
  // Section 9 Dates
  licenseDate?: string;
  replanningActDate?: string;
  cfoDate?: string;
  
  // Arrays of objects
  units: Unit[];
  garages: Garage[];
  storages: Storage[];

  // [NUEVO] Propiedades para almacenar definiciones dinámicas de columnas
  unitColumnHeaders?: string[];
  unitColumnGroups?: string[];
  garageColumnHeaders?: string[];
  garageColumnGroups?: string[];
  storageColumnHeaders?: string[];
}