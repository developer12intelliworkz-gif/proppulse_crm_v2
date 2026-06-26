import { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Plus, Search, Home, MapPin, Bed, Bath, Maximize
} from "lucide-react";
import CreatePropertyForm from './CreatePropertyForm';
import { useToast } from "@/hooks/use-toast";

const PropertiesManagement = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const { toast } = useToast();

  // Mock data - replace with API later
  const mockProperties = [
    {
      id: 1,
      address: "123 Main Street",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      type: "house",
      price: 750000,
      beds: 3,
      baths: 2.5,
      sqft: 2100,
      status: "available",
      description: "Beautiful family home with modern updates",
      listingDate: "2024-01-10",
      agent: "Sarah Johnson",
      images: []
    },
    {
      id: 2,
      address: "456 Oak Avenue",
      city: "Beverly Hills",
      state: "CA",
      zipCode: "90211",
      type: "condo",
      price: 950000,
      beds: 2,
      baths: 2,
      sqft: 1800,
      status: "pending",
      description: "Luxury condo with city views",
      listingDate: "2024-01-08",
      agent: "Mike Wilson",
      images: []
    }
  ];

  useEffect(() => {
    setProperties(mockProperties);
    setFilteredProperties(mockProperties);
  }, []);

  useEffect(() => {
    let filtered = properties;

    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.type === typeFilter);
    }

    setFilteredProperties(filtered);
  }, [searchQuery, statusFilter, typeFilter, properties]);

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-blue-100 text-blue-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleEditSave = (updatedProperty) => {
    setProperties(prev =>
      prev.map(p => p.id === updatedProperty.id ? updatedProperty : p)
    );
    setIsEditModalOpen(false);
    // toast({
      // title: "Property Updated",
      // description: "Property details have been updated successfully",
    // });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Properties Management
              </CardTitle>
              <CardDescription>
                Manage your property listings and inventory
              </CardDescription>
            </div>

            {/* Add Property Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>Add a new property to your listings</DialogDescription>
                </DialogHeader>
                <CreatePropertyForm
                  onClose={() => setIsCreateModalOpen(false)}
                  onPropertyCreated={(newProperty) => {
                    setProperties(prev => [...prev, newProperty]);
                    setIsCreateModalOpen(false);
                    // toast({
                      // title: "Property Added",
                      // description: "New property has been added successfully",
                    // });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-200 relative">
                  <div className="absolute top-3 right-3">
                    <Badge className={getStatusColor(property.status)}>
                      {property.status}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    {formatPrice(property.price)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{property.address}</h3>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{property.city}, {property.state} {property.zipCode}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{property.beds} beds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{property.baths} baths</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Maximize className="h-4 w-4" />
                        <span>{property.sqft} sqft</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {property.description}
                    </p>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Agent: {property.agent}</span>
                        <span className="text-gray-600">Listed: {property.listingDate}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedProperty(property);
                          setIsEditModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedProperty(property);
                          setIsViewModalOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
            <DialogDescription>
              Full information about the selected property
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>Address:</strong> {selectedProperty.address}</p>
              <p><strong>City:</strong> {selectedProperty.city}</p>
              <p><strong>State:</strong> {selectedProperty.state}</p>
              <p><strong>Zip Code:</strong> {selectedProperty.zipCode}</p>
              <p><strong>Type:</strong> {selectedProperty.type}</p>
              <p><strong>Status:</strong> {selectedProperty.status}</p>
              <p><strong>Price:</strong> {formatPrice(selectedProperty.price)}</p>
              <p><strong>Beds:</strong> {selectedProperty.beds}</p>
              <p><strong>Baths:</strong> {selectedProperty.baths}</p>
              <p><strong>Sqft:</strong> {selectedProperty.sqft}</p>
              <p><strong>Description:</strong> {selectedProperty.description}</p>
              <p><strong>Agent:</strong> {selectedProperty.agent}</p>
              <p><strong>Listed Date:</strong> {selectedProperty.listingDate}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>Update the selected property</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave(selectedProperty);
              }}
            >
              <Input
                name="address"
                value={selectedProperty.address}
                onChange={(e) =>
                  setSelectedProperty({ ...selectedProperty, address: e.target.value })
                }
              />
              <Input
                name="city"
                value={selectedProperty.city}
                onChange={(e) =>
                  setSelectedProperty({ ...selectedProperty, city: e.target.value })
                }
              />
              <Input
                name="price"
                value={selectedProperty.price}
                onChange={(e) =>
                  setSelectedProperty({ ...selectedProperty, price: parseInt(e.target.value) })
                }
              />
              <Textarea
                name="description"
                value={selectedProperty.description}
                onChange={(e) =>
                  setSelectedProperty({ ...selectedProperty, description: e.target.value })
                }
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertiesManagement;
