import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Project Name is required' })
  projectName: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  engineerName?: string;

  @IsString()
  @IsOptional()
  projectType?: string; // Residential, Commercial, Industrial, Institutional, Infrastructure, Other

  @IsString()
  @IsOptional()
  buildingType?: string; // Individual House, Villa, Apartment, Office, Commercial Building, Warehouse, Other

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfFloors?: number;

  @IsString()
  @IsOptional()
  soilType?: string; // Rock, Gravel, Sand, Silt, Clay, Expansive Soil, Mixed, Other

  @IsString()
  @IsOptional()
  designCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @IsString()
  @IsOptional()
  unitSystem?: string; // metric | imperial

  @IsString()
  @IsOptional()
  rateSourceId?: string;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsNumber()
  @IsOptional()
  gstRate?: number;

  @IsNumber()
  @IsOptional()
  overheadPercentage?: number;

  @IsNumber()
  @IsOptional()
  contingencyRate?: number;

  // Canvas configuration defaults
  @IsNumber()
  @IsOptional()
  floorLength?: number;

  @IsNumber()
  @IsOptional()
  floorWidth?: number;

  @IsNumber()
  @IsOptional()
  floorHeight?: number;

  @IsNumber()
  @IsOptional()
  wallHeight?: number;

  @IsNumber()
  @IsOptional()
  wallThickness?: number;

  @IsString()
  @IsOptional()
  templateType?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  projectName?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  engineerName?: string;

  @IsString()
  @IsOptional()
  projectType?: string;

  @IsString()
  @IsOptional()
  buildingType?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @IsOptional()
  numberOfFloors?: number;

  @IsString()
  @IsOptional()
  soilType?: string;

  @IsString()
  @IsOptional()
  designCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @IsString()
  @IsOptional()
  rateSourceId?: string;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsNumber()
  @IsOptional()
  gstRate?: number;

  @IsNumber()
  @IsOptional()
  overheadPercentage?: number;

  @IsNumber()
  @IsOptional()
  contingencyRate?: number;
}
