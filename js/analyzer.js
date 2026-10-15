// Real Estate Price Estimator using simulated market data
class RealEstateAnalyzer {
    constructor() {
        this.form = document.getElementById('propertyForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.analyzeBtn = document.querySelector('.analyze-btn');
        this.currentYear = new Date().getFullYear();
        this.form.querySelector('#yearBuilt').max = String(this.currentYear);
        document.getElementById('currentYear').textContent = String(this.currentYear);
        
        this.marketDataProvider = null;
        
        this.initializeEventListeners();
        this.loadMarketData();
        this.initializeMarketDataProvider();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeProperty();
        });

        // Real-time form validation
        this.form.addEventListener('input', () => {
            this.validateForm();
        });

        this.form.addEventListener('change', () => {
            this.validateForm();
        });

        this.validateForm(false);
    }

    async initializeMarketDataProvider() {
        try {
            this.marketDataProvider = window.DemoMarketData || null;
            this.updateAPIStatus('demo', 'Demo data only');
        } catch (error) {
            console.warn('Demo market data initialization failed:', error);
            this.updateAPIStatus('demo', 'Demo data only');
        }
    }

    updateAPIStatus(status, message) {
        const statusElement = document.getElementById('apiStatus');
        if (statusElement) {
            statusElement.className = `api-status ${status}`;
            statusElement.textContent = message;
        }
    }

    async fetchMarketListings(location, propertyType = 'house') {
        if (!this.marketDataProvider) {
            return null;
        }

        try {
            // Search for properties in the specified location
            const searchParams = {
                location: location,
                propertyType: propertyType,
                limit: 10,
                sortBy: 'price',
                order: 'asc'
            };

            const results = await this.marketDataProvider.searchProperties(searchParams);
            return results;
        } catch (error) {
            console.error('Error loading demo market listings:', error);
            return null;
        }
    }

    async getPropertyComparables(location, bedrooms, bathrooms, sqft) {
        if (!this.marketDataProvider) {
            return this.generateFallbackComparables(location, bedrooms, bathrooms, sqft);
        }

        try {
            const searchParams = {
                location: location,
                bedrooms: bedrooms,
                bathrooms: bathrooms,
                minPrice: Math.round(sqft * 3000), // Minimum price estimate
                maxPrice: Math.round(sqft * 6000), // Maximum price estimate
                limit: 5
            };

            const comparables = await this.marketDataProvider.searchProperties(searchParams);
            return this.formatComparables(comparables);
        } catch (error) {
            console.error('Error loading demo comparables:', error);
            return this.generateFallbackComparables(location, bedrooms, bathrooms, sqft);
        }
    }

    formatComparables(properties) {
        return properties.map(property => ({
            address: property.address || property.title,
            details: `${property.bedrooms || 'N/A'} bed, ${property.bathrooms || 'N/A'} bath, ${property.size || 'N/A'} sqft`,
            price: `R ${property.price ? property.price.toLocaleString() : 'N/A'}`,
            date: property.dateListed || 'Recently listed',
            url: property.url || '#',
            image: property.images ? property.images[0] : null
        }));
    }

    generateFallbackComparables(location, bedrooms, bathrooms, sqft) {
        return [
            {
                address: this.generateAddress(location),
                details: `${bedrooms} bed, ${bathrooms} bath, ${Math.round(sqft * 0.95)} sqft`,
                price: `R ${Math.round(sqft * 4500).toLocaleString()}`,
                date: 'Demo comparable',
                url: '#',
                image: null
            },
            {
                address: this.generateAddress(location),
                details: `${bedrooms} bed, ${bathrooms} bath, ${Math.round(sqft * 1.05)} sqft`,
                price: `R ${Math.round(sqft * 4800).toLocaleString()}`,
                date: 'Demo comparable',
                url: '#',
                image: null
            },
            {
                address: this.generateAddress(location),
                details: `${bedrooms} bed, ${bathrooms} bath, ${sqft} sqft`,
                price: `R ${Math.round(sqft * 5200).toLocaleString()}`,
                date: 'Demo comparable',
                url: '#',
                image: null
            }
        ];
    }

    loadMarketData() {
        // Market data for different cities (base prices per sqft in Rands)
        this.marketData = {
            'Sandton, Johannesburg': {
                basePricePerSqft: 4850,
                marketTrend: 2.3,
                daysOnMarket: 15,
                demandFactor: 1.12,
                schoolQuality: 8.5,
                crimeRate: 'Low'
            },
            'Cape Town, Western Cape': {
                basePricePerSqft: 5200,
                marketTrend: 1.8,
                daysOnMarket: 45,
                demandFactor: 1.08,
                schoolQuality: 7.8,
                crimeRate: 'Medium'
            },
            'Durban, KwaZulu-Natal': {
                basePricePerSqft: 3800,
                marketTrend: 3.1,
                daysOnMarket: 25,
                demandFactor: 1.15,
                schoolQuality: 7.2,
                crimeRate: 'Medium'
            },
            'Pretoria, Gauteng': {
                basePricePerSqft: 4200,
                marketTrend: 1.2,
                daysOnMarket: 35,
                demandFactor: 0.95,
                schoolQuality: 7.5,
                crimeRate: 'Medium'
            },
            'Port Elizabeth, Eastern Cape': {
                basePricePerSqft: 3200,
                marketTrend: 4.2,
                daysOnMarket: 20,
                demandFactor: 1.18,
                schoolQuality: 6.8,
                crimeRate: 'Medium'
            },
            'Bloemfontein, Free State': {
                basePricePerSqft: 2800,
                marketTrend: 2.8,
                daysOnMarket: 18,
                demandFactor: 1.10,
                schoolQuality: 8.2,
                crimeRate: 'Low'
            }
        };

        // Amenity value multipliers
        this.amenityMultipliers = {
            garage: 1.05,
            pool: 1.08,
            fireplace: 1.03,
            basement: 1.06,
            centralAC: 1.02,
            hardwoodFloors: 1.04
        };

        // Bedroom and bathroom adjustments
        this.roomAdjustments = {
            bedrooms: {
                1: 0.85,
                2: 0.95,
                3: 1.00,
                4: 1.08,
                5: 1.15
            },
            bathrooms: {
                1: 0.90,
                1.5: 0.95,
                2: 1.00,
                2.5: 1.05,
                3: 1.10,
                3.5: 1.15,
                4: 1.20
            }
        };
    }

    validateForm(showFeedback = true) {
        const invalidField = this.form.querySelector(':invalid');
        const isValid = !invalidField;
        const feedback = document.getElementById('formFeedback');

        this.form.querySelectorAll('.form-group input, .form-group select').forEach(element => {
            element.style.borderColor = element.value && !element.validity.valid ? '#dc3545' : '#e9ecef';
        });

        this.analyzeBtn.disabled = !isValid;
        this.analyzeBtn.style.opacity = isValid ? '1' : '0.6';
        if (feedback) {
            feedback.textContent = showFeedback && invalidField ? this.getValidationMessage(invalidField) : '';
        }
        return isValid;
    }

    getValidationMessage(field) {
        const messages = {
            location: 'Select a location to continue.',
            bedrooms: 'Select the number of bedrooms.',
            bathrooms: 'Select the number of bathrooms.',
            sqft: 'Enter a floor area between 1 and 100,000 square feet.',
            yearBuilt: `Enter a year from 1800 to ${this.currentYear}, or leave it blank.`,
            lotSize: 'Enter a lot size from 0 to 1,000 acres, or leave it blank.'
        };
        return messages[field.id] || 'Check the highlighted property details.';
    }

    async analyzeProperty() {
        // Show loading state
        this.showLoading();

        const formData = new FormData(this.form);
        const propertyData = this.extractFormData(formData);
        
        try {
            const marketListings = await this.fetchMarketListings(propertyData.location);
            
            // Calculate price with enhanced data
            const analysis = await this.calculatePriceWithMarketData(propertyData, marketListings);
            
            // Fetch demonstration comparables for the selected property.
            const comparables = await this.getPropertyComparables(
                propertyData.location, 
                propertyData.bedrooms, 
                propertyData.bathrooms, 
                propertyData.sqft
            );
            
            analysis.comparables = comparables;
            this.displayResults(analysis, propertyData);
        } catch (error) {
            console.error('Error during property analysis:', error);
            // Fallback to original calculation
            const analysis = this.calculatePrice(propertyData);
            this.displayResults(analysis, propertyData);
        }
        
        this.hideLoading();
    }

    extractFormData(formData) {
        const data = {};
        for (let [key, value] of formData.entries()) {
            if (key === 'sqft' || key === 'yearBuilt' || key === 'lotSize') {
                data[key] = parseFloat(value) || 0;
            } else if (key === 'bedrooms' || key === 'bathrooms') {
                data[key] = parseFloat(value) || 0;
            } else if (key === 'location') {
                data[key] = value;
            } else {
                data[key] = value === 'true';
            }
        }
        return data;
    }

    async calculatePriceWithMarketData(propertyData, marketListings) {
        const location = propertyData.location;
        const marketData = this.marketData[location] || this.marketData['Sandton, Johannesburg'];
        
        // Blend local sample listings with the location's configured base rate.
        let basePrice = propertyData.sqft * marketData.basePricePerSqft;
        
        // Adjust based on Property24 market data if available
        if (marketListings && marketListings.length > 0) {
            const avgPricePerSqft = this.calculateAveragePricePerSqft(marketListings);
            if (avgPricePerSqft > 0) {
                // Blend the sample listing rate with the configured market rate.
                const blendedPricePerSqft = (avgPricePerSqft * 0.7) + (marketData.basePricePerSqft * 0.3);
                basePrice = propertyData.sqft * blendedPricePerSqft;
            }
        }
        
        return this.calculatePrice(propertyData, basePrice);
    }

    calculateAveragePricePerSqft(listings) {
        if (!listings || listings.length === 0) return 0;
        
        const validProperties = listings.filter(prop =>
            prop.price && prop.size && prop.size > 0
        );
        
        if (validProperties.length === 0) return 0;
        
        const totalPricePerSqft = validProperties.reduce((sum, prop) => {
            return sum + (prop.price / prop.size);
        }, 0);
        
        return totalPricePerSqft / validProperties.length;
    }

    calculatePrice(propertyData, customBasePrice = null) {
        const location = propertyData.location;
        const marketData = this.marketData[location] || this.marketData['Sandton, Johannesburg'];
        
        // Base calculation
        let basePrice = customBasePrice || (propertyData.sqft * marketData.basePricePerSqft);
        
        // Room adjustments
        const bedroomMultiplier = this.roomAdjustments.bedrooms[propertyData.bedrooms] || 1.0;
        const bathroomMultiplier = this.roomAdjustments.bathrooms[propertyData.bathrooms] || 1.0;
        
        basePrice *= bedroomMultiplier * bathroomMultiplier;
        
        // Amenity adjustments
        let amenityMultiplier = 1.0;
        Object.keys(this.amenityMultipliers).forEach(amenity => {
            if (propertyData[amenity]) {
                amenityMultiplier *= this.amenityMultipliers[amenity];
            }
        });
        
        basePrice *= amenityMultiplier;
        
        // Market demand factor
        basePrice *= marketData.demandFactor;
        
        // Year built adjustment (newer homes worth more)
        if (propertyData.yearBuilt) {
            const age = this.currentYear - propertyData.yearBuilt;
            const ageMultiplier = Math.max(0.7, 1 - (age * 0.005));
            basePrice *= ageMultiplier;
        }
        
        // Lot size adjustment
        if (propertyData.lotSize) {
            const lotMultiplier = 1 + Math.min(propertyData.lotSize * 0.1, 0.3);
            basePrice *= lotMultiplier;
        }
        
        // Calculate price range (±8%)
        const range = basePrice * 0.08;
        const minPrice = Math.round(basePrice - range);
        const maxPrice = Math.round(basePrice + range);
        
        // Calculate confidence level
        const confidence = this.calculateConfidence(propertyData, marketData);
        
        return {
            minPrice,
            maxPrice,
            basePrice: Math.round(basePrice),
            confidence,
            marketData,
            propertyData
        };
    }

    calculateConfidence(propertyData, marketData) {
        let confidence = 85; // Base confidence
        
        // Reduce confidence for missing data
        if (!propertyData.yearBuilt) confidence -= 10;
        if (!propertyData.lotSize) confidence -= 5;
        
        // Adjust based on market data availability
        if (!this.marketData[propertyData.location]) {
            confidence -= 15; // Using default market data
        }
        
        // Adjust based on property size (very small or very large homes have less data)
        if (propertyData.sqft < 800 || propertyData.sqft > 4000) {
            confidence -= 10;
        }
        
        return Math.max(60, Math.min(95, confidence));
    }

    displayResults(analysis, propertyData) {
        // Update price range
        document.getElementById('priceRange').textContent = 
            `R ${analysis.minPrice.toLocaleString()} - R ${analysis.maxPrice.toLocaleString()}`;
        
        // Update confidence meter
        const confidenceFill = document.getElementById('confidenceFill');
        const confidenceText = document.getElementById('confidenceText');
        confidenceFill.style.width = `${analysis.confidence}%`;
        confidenceText.textContent = `${analysis.confidence}%`;
        
        // Update key influencers
        this.updateKeyInfluencers(analysis, propertyData);
        
        // Update comparables
        this.updateComparables(analysis, propertyData);
        
        // Update enhancement tips
        this.updateEnhancementTips(analysis, propertyData);
        
        // Update market insights
        this.updateMarketInsights(analysis, propertyData);
        
        // Update property images
        this.updatePropertyImages(analysis, propertyData);
        
        // Update location map
        this.updateLocationMap(analysis, propertyData);
        
        // Show results
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    updateKeyInfluencers(analysis, propertyData) {
        const influencersList = document.getElementById('keyInfluencers');
        const marketData = analysis.marketData;
        
        const influencers = [
            {
                factor: 'School District Quality',
                impact: marketData.schoolQuality > 8 ? '+8%' : marketData.schoolQuality > 7 ? '+5%' : '+2%',
                type: 'positive'
            },
            {
                factor: 'Crime Rate',
                impact: marketData.crimeRate === 'Low' ? '+5%' : marketData.crimeRate === 'Medium' ? '+2%' : '-3%',
                type: marketData.crimeRate === 'Low' ? 'positive' : marketData.crimeRate === 'High' ? 'negative' : 'positive'
            },
            {
                factor: 'Market Demand',
                impact: marketData.demandFactor > 1.1 ? '+12%' : marketData.demandFactor > 1.05 ? '+8%' : '+3%',
                type: 'positive'
            },
            {
                factor: 'Property Age',
                impact: propertyData.yearBuilt ? (this.currentYear - propertyData.yearBuilt < 10 ? '+6%' : (this.currentYear - propertyData.yearBuilt < 20 ? '+3%' : '-2%')) : 'N/A',
                type: propertyData.yearBuilt ? (this.currentYear - propertyData.yearBuilt < 20 ? 'positive' : 'negative') : 'neutral'
            }
        ];

        influencersList.innerHTML = influencers
            .filter(inf => inf.impact !== 'N/A')
            .map(inf => `
                <li>
                    <span class="factor">${inf.factor}:</span> 
                    <span class="impact ${inf.type}">${inf.impact}</span>
                </li>
            `).join('');
    }

    updateComparables(analysis, propertyData) {
        const comparablesList = document.getElementById('comparables');
        
        // Use demonstration comparables if available, otherwise fallback.
        const comparables = analysis.comparables || this.generateFallbackComparables(
            propertyData.location, 
            propertyData.bedrooms, 
            propertyData.bathrooms, 
            propertyData.sqft
        );

        comparablesList.innerHTML = comparables.map(comp => {
            const listingUrl = this.getSafeListingUrl(comp.url);
            return `
                <div class="comparable-item">
                    <span class="address">${this.escapeHTML(comp.address)}</span>
                    <span class="details">${this.escapeHTML(comp.details)}</span>
                    <span class="price">${this.escapeHTML(comp.price)}</span>
                    <span class="date">${this.escapeHTML(comp.date)}</span>
                    ${listingUrl ? `<a href="${this.escapeHTML(listingUrl)}" target="_blank" rel="noopener noreferrer" class="view-listing">View Listing</a>` : ''}
                </div>
            `;
        }).join('');
    }

    escapeHTML(value) {
        const characters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value ?? '').replace(/[&<>"']/g, character => characters[character]);
    }

    getSafeListingUrl(value) {
        if (!value || value === '#') return null;
        try {
            const url = new URL(value, window.location.href);
            return url.protocol === 'https:' ? url.href : null;
        } catch {
            return null;
        }
    }

    generateAddress(location) {
        const streets = ['Oak St', 'Maple Ave', 'Pine Rd', 'Elm St', 'Cedar Ln', 'Willow Dr'];
        const numbers = Math.floor(Math.random() * 9999) + 1000;
        const street = streets[Math.floor(Math.random() * streets.length)];
        return `${numbers} ${street}, ${location}`;
    }

    updateEnhancementTips(analysis, propertyData) {
        const tipsList = document.getElementById('enhancementTips');
        
        const tips = [
            'Adding a patio could boost value by ~5%',
            'Kitchen renovation: potential 10-15% increase',
            'Energy-efficient upgrades: 3-7% premium',
            'Fresh paint and landscaping: 2-4% boost',
            'Smart home features: 3-5% premium'
        ];

        tipsList.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');
    }

    updateMarketInsights(analysis, propertyData) {
        const insightsList = document.getElementById('marketInsights');
        const marketData = analysis.marketData;
        
        const insights = [
            {
                metric: 'Days on Market:',
                value: `${marketData.daysOnMarket} days (avg)`
            },
            {
                metric: 'Price per sqft:',
                value: `R ${marketData.basePricePerSqft.toLocaleString()}`
            },
            {
                metric: 'Market Trend:',
                value: `${marketData.marketTrend > 0 ? '+' : ''}${marketData.marketTrend}% (3 months)`,
                trend: marketData.marketTrend > 0 ? 'up' : 'down'
            }
        ];

        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <span class="metric">${insight.metric}</span>
                <span class="value ${insight.trend ? `trend-${insight.trend}` : ''}">${insight.value}</span>
            </div>
        `).join('');
    }

    updatePropertyImages(analysis, propertyData) {
        const propertyImagesContainer = document.getElementById('propertyImages');
        const location = propertyData.location;
        
        // Use reliable South African property images
        const images = this.getSouthAfricanPropertyImages(propertyData);
        
        propertyImagesContainer.innerHTML = `
            <div class="property-gallery">
                ${images.map((image, index) => `
                    <div class="property-image">
                        <img src="${image.url}" alt="${image.description}" onerror="this.src='https://via.placeholder.com/300x200/667eea/ffffff?text=${image.description}'">
                        <div class="image-overlay">${image.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getSouthAfricanPropertyImages(propertyData) {
        // Curated South African property images from reliable sources
        const baseImages = [
            {
                url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
                description: 'Modern South African Home'
            },
            {
                url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
                description: 'Luxury House Exterior'
            },
            {
                url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
                description: 'Spacious Kitchen'
            },
            {
                url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
                description: 'Master Bedroom'
            }
        ];

        // Add specific images based on amenities
        const additionalImages = [];
        
        if (propertyData.pool) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop',
                description: 'Swimming Pool'
            });
        }
        
        if (propertyData.garage) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
                description: 'Double Garage'
            });
        }
        
        if (propertyData.fireplace) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=300&fit=crop',
                description: 'Fireplace'
            });
        }
        
        if (propertyData.sqft > 2500) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
                description: 'Large Living Area'
            });
        }

        return [...baseImages, ...additionalImages];
    }

    getImageDescription(type, propertyData) {
        const descriptions = {
            'exterior': `${propertyData.bedrooms} Bed House`,
            'kitchen': 'Modern Kitchen',
            'living-room': 'Spacious Living Area',
            'bedroom': 'Master Bedroom'
        };
        return descriptions[type] || 'Property View';
    }

    updateLocationMap(analysis, propertyData) {
        const locationMapContainer = document.getElementById('locationMap');
        const location = propertyData.location;
        
        // Generate map based on location
        const mapData = this.getMapData(location);
        
        // Use a static South African map with location pins
        locationMapContainer.innerHTML = `
            <div class="interactive-map">
                <div class="sa-map-container">
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=300&fit=crop" 
                         alt="South Africa Map" 
                         class="sa-map-image"
                         onerror="this.src='https://via.placeholder.com/600x300/28a745/ffffff?text=South+Africa+Map'">
                    <div class="location-pin" style="${this.getPinPosition(location)}">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="pin-label">${location.split(',')[0]}</span>
                    </div>
                </div>
            </div>
            <div class="map-info">
                <h4>${location}</h4>
                <p>${mapData.description}</p>
                <div class="location-details">
                    <span class="detail-item"><i class="fas fa-building"></i> ${this.getCityType(location)}</span>
                    <span class="detail-item"><i class="fas fa-chart-line"></i> ${mapData.marketTrend || 'Growing'} Market</span>
                </div>
            </div>
        `;
    }

    getPinPosition(location) {
        // Approximate positions for South African cities on a map
        const positions = {
            'Sandton, Johannesburg': 'top: 35%; left: 60%;',
            'Cape Town, Western Cape': 'top: 75%; left: 25%;',
            'Durban, KwaZulu-Natal': 'top: 65%; left: 70%;',
            'Pretoria, Gauteng': 'top: 30%; left: 65%;',
            'Port Elizabeth, Eastern Cape': 'top: 80%; left: 45%;',
            'Bloemfontein, Free State': 'top: 45%; left: 50%;'
        };
        
        return positions[location] || 'top: 50%; left: 50%;';
    }

    getCityType(location) {
        const cityTypes = {
            'Sandton, Johannesburg': 'Business District',
            'Cape Town, Western Cape': 'Coastal City',
            'Durban, KwaZulu-Natal': 'Coastal City',
            'Pretoria, Gauteng': 'Administrative Capital',
            'Port Elizabeth, Eastern Cape': 'Coastal City',
            'Bloemfontein, Free State': 'Central City'
        };
        
        return cityTypes[location] || 'Major City';
    }

    getMapData(location) {
        const mapData = {
            'Sandton, Johannesburg': {
                description: 'Premium business district with luxury properties and excellent amenities',
                marketTrend: 'High Growth'
            },
            'Cape Town, Western Cape': {
                description: 'Coastal city with stunning mountain views and diverse property options',
                marketTrend: 'Stable Growth'
            },
            'Durban, KwaZulu-Natal': {
                description: 'Tropical coastal city with warm climate and beachfront properties',
                marketTrend: 'Moderate Growth'
            },
            'Pretoria, Gauteng': {
                description: 'Administrative capital with established neighborhoods and good schools',
                marketTrend: 'Steady Growth'
            },
            'Port Elizabeth, Eastern Cape': {
                description: 'Coastal city with affordable properties and growing investment potential',
                marketTrend: 'Emerging Market'
            },
            'Bloemfontein, Free State': {
                description: 'Central city with good value properties and family-friendly environment',
                marketTrend: 'Stable Market'
            }
        };
        
        return mapData[location] || {
            description: 'Prime location with excellent investment potential',
            marketTrend: 'Growing Market'
        };
    }

    showLoading() {
        this.analyzeBtn.innerHTML = '<div class="loading"></div> Analyzing...';
        this.analyzeBtn.disabled = true;
    }

    hideLoading() {
        this.analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Property';
        this.validateForm(false);
    }
}

// Global function to reset form
function resetForm() {
    const form = document.getElementById('propertyForm');
    form.reset();
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('formFeedback').textContent = '';
    
    // Reset form validation styling
    const inputs = document.querySelectorAll('.form-group input, .form-group select');
    inputs.forEach(input => {
        input.style.borderColor = '#e9ecef';
    });
    
    // Reset button state
    const analyzeBtn = document.querySelector('.analyze-btn');
    analyzeBtn.disabled = true;
    analyzeBtn.style.opacity = '0.6';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize the analyzer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RealEstateAnalyzer();
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to analysis cards
    const cards = document.querySelectorAll('.analysis-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
    });

    // Add smooth scrolling for better UX
    const smoothScroll = (target) => {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.target.blur();
        }
    });
}); 