"""
Flask web application for generating deployment specification PDFs.
This application allows users to input deployment information and generates
a professional PDF document with infrastructure details, contacts, and support information.
"""

from flask import Flask, render_template, request, send_file
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime
from werkzeug.utils import secure_filename
import os
from PIL import Image

#testing git commit againsss

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

class BasePDFGenerator:
    """
    Base class for PDF generation with common functionality.
    Handles basic PDF setup, title page creation, and common sections.
    """
    def __init__(self, form_data):
        """
        Initialize PDF generator with form data.
        
        Args:
            form_data (dict): Dictionary containing form submission data
        """
        self.form_data = form_data
        self.today = datetime.today().strftime("%Y-%m-%d")
        self.customer_name = form_data.get("customer_name", "Unknown Customer")
        
        # PDF setup
        os.makedirs("generated", exist_ok=True)
        self.filename = self._generate_filename()
        self.filepath = os.path.join("generated", self.filename)
        self.canvas = canvas.Canvas(self.filepath, pagesize=letter)
        self.width, self.height = letter
        
    def _generate_filename(self):
        """
        Generate unique filename for the PDF.
        To be implemented by child classes.
        """
        raise NotImplementedError
        
    def generate(self):
        """
        Main method to generate the complete PDF document.
        Orchestrates the creation of all sections in the correct order.
        """
        self.draw_title_page()
        self.draw_infrastructure_and_info()
        if self.has_network_diagram():
            self.draw_network_diagram()
        self.canvas.save()
        return self.filepath
        
    def draw_title_page(self):
        """
        Creates the title page of the PDF with:
        - Company logo
        - Document title
        - Customer name
        - Compilation date
        - Page number and confidentiality mark
        """
        # Draw logo at the top center of the page
        logo_path = os.path.join("static", "ataccama_logo.png")
        print(f"Looking for logo at: {os.path.abspath(logo_path)}")  # Debug print
        
        if os.path.exists(logo_path):
            print("Logo file found!")  # Debug print
            # Center the logo horizontally and position it higher
            logo_width = 150  # Increased size
            logo_x = (self.width - logo_width) / 2
            logo_y = self.height - 250  # Adjusted position
            
            try:
                self.canvas.drawImage(
                    logo_path, 
                    logo_x, 
                    logo_y, 
                    width=logo_width, 
                    height=logo_width,  # Make it square
                    preserveAspectRatio=True,
                    mask=None  # Changed from 'auto' to None
                )
                print("Logo drawn successfully")  # Debug print
            except Exception as e:
                print(f"Error drawing logo: {str(e)}")  # Debug print
        else:
            print(f"Logo file not found at {logo_path}")  # Debug print
            
        # Draw main title with more space below logo
        self.canvas.setFont("Helvetica-Bold", 24)
        self.canvas.drawCentredString(self.width/2, self.height - 350, "Ataccama Deployment Specification")
        
        # Draw customer name with proper spacing
        self.canvas.setFont("Helvetica", 18)
        self.canvas.drawCentredString(self.width/2, self.height - 400, self.customer_name)
        
        # Draw compilation date at bottom
        self.canvas.setFont("Helvetica", 10)
        self.canvas.drawCentredString(self.width/2, 100, f"Compiled on: {self.today}")
        
        # Add page number and confidential mark to title page
        self._draw_page_footer(1)
        
        self.canvas.showPage()
        
    def draw_infrastructure_and_info(self):
        """
        Draws the main content sections including:
        - Infrastructure details
        - Contact information
        - Support resources
        - Environment URLs
        """
        y = self.height - 50
        
        # Get deployment style for prefix
        deployment_style = self.form_data.get("deployment_style")
        prefix = "cloud_" if deployment_style == "cloud" else "dedicated_"
        
        # Infrastructure section
        y = self._draw_section_heading(y, "Infrastructure")
        y, _ = self._draw_key_values(y - 10, self._get_infrastructure_fields(), section="infrastructure")
        
        # Spacing
        y -= 30
        
        # Contacts section
        y = self._draw_section_heading(y, "Contacts")
        onboarding_manager = self.form_data.get(f"{prefix}onboarding_manager")
        success_manager = self.form_data.get(f"{prefix}success_manager")
        
        if onboarding_manager or success_manager:
            contacts = []
            if onboarding_manager:
                contacts.append(("Customer Onboarding Manager", onboarding_manager))
            if success_manager:
                contacts.append(("Customer Success Manager", success_manager))
        else:
            contacts = [("Ataccama Support", "support@ataccama.com")]
        
        y, _ = self._draw_key_values(y - 10, contacts, section="contacts")
        
        # Spacing
        y -= 30
        
        # Support section
        y = self._draw_section_heading(y, "Support")
        y, _ = self._draw_key_values(y - 10, [
            ("Support Portal", "https://support.ataccama.com/"),
            ("Support Handbook", "https://www.ataccama.com/support-handbook"),
            ("Service Desk", "https://atajira.atlassian.net/servicedesk/customer/portals")
        ], section="support")

        # Add page number and confidential mark
        self._draw_page_footer(2)
        self.canvas.showPage()
        
        # Draw URLs on the next page
        urls = self._generate_urls()
        if urls:
            page_number = 3
            y = self.height - 50
            
            # Draw initial URLs heading
            y = self._draw_section_heading(y, "URLs")
            
            # Group URLs by environment
            current_env = None
            env_urls = []
            
            for label, value in urls:
                if label.startswith("Environment:"):
                    if current_env is not None:
                        # Check if we need a new page before drawing URLs
                        required_height = 20 * (len(env_urls) + 1)  # +1 for environment header
                        if y - required_height < 100:  # Increased minimum space requirement
                            self._draw_page_footer(page_number)
                            self.canvas.showPage()
                            page_number += 1
                            y = self.height - 50
                            y = self._draw_section_heading(y, "URLs (continued)")
                        
                        # Draw the previous environment's URLs
                        self.canvas.setFont("Helvetica-Bold", 12)
                        self.canvas.drawString(50, y, current_env)
                        y -= 20
                        y, _ = self._draw_key_values(y - 10, env_urls, section="urls")
                        y -= 20
                    
                    # Start new environment
                    current_env = label
                    env_urls = []
                elif value:  # Only add if there's a value
                    env_urls.append((label.strip(), value))
            
            # Draw the last environment's URLs
            if env_urls:
                # Check if we need a new page for the last set of URLs
                required_height = 20 * (len(env_urls) + 1)  # +1 for environment header
                if y - required_height < 100:  # Increased minimum space requirement
                    self._draw_page_footer(page_number)
                    self.canvas.showPage()
                    page_number += 1
                    y = self.height - 50
                    y = self._draw_section_heading(y, "URLs (continued)")
                
                # Draw the last environment header and its URLs
                self.canvas.setFont("Helvetica-Bold", 12)
                self.canvas.drawString(50, y, current_env)
                y -= 20
                y, _ = self._draw_key_values(y - 10, env_urls, section="urls")
            
            self._draw_page_footer(page_number)
            self.canvas.showPage()
        else:
            self._draw_page_footer(2)
            self.canvas.showPage()
        
    def draw_environments(self):
        """
        Draws environment-specific information.
        To be implemented by child classes.
        """
        raise NotImplementedError
        
    def draw_network_diagram(self):
        """
        Handles the network diagram section:
        - Processes uploaded diagram
        - Switches to landscape orientation
        - Scales and centers the diagram
        - Adds appropriate labels and formatting
        """
        if not self.has_network_diagram():
            return
            
        # Get the uploaded file
        file = request.files['network_diagram']
        if not file or not file.filename:
            return
            
        # Save the file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Switch to landscape orientation without creating a new page
            self.canvas.setPageSize(landscape(letter))  # Switch to landscape
            self.width, self.height = landscape(letter)  # Update dimensions for landscape
            
            # Draw the section heading
            y = self.height - 50
            y = self._draw_section_heading(y, "Network/Architecture")
            
            # Open the image to get its dimensions
            with Image.open(filepath) as img:
                img_width, img_height = img.size
                
                # Calculate scaling to fit the page
                max_width = self.width - 100  # Leave margins
                max_height = self.height - 150  # Leave more space for heading
                
                # Calculate scaling ratio
                width_ratio = max_width / img_width
                height_ratio = max_height / img_height
                scale = min(width_ratio, height_ratio)
                
                # Calculate new dimensions
                new_width = img_width * scale
                new_height = img_height * scale
                
                # Calculate position to center the image
                x = (self.width - new_width) / 2
                y = (self.height - new_height - 100) / 2  # Adjust for heading
                
                # Draw the image
                self.canvas.drawImage(
                    filepath,
                    x,
                    y,
                    width=new_width,
                    height=new_height,
                    preserveAspectRatio=True
                )
                
                # Add page number and confidential mark
                self._draw_page_footer(3)
                self.canvas.showPage()
                
                # Reset back to portrait for any subsequent pages
                self.canvas.setPageSize(letter)
                self.width, self.height = letter
                
        except Exception as e:
            print(f"Error drawing network diagram: {str(e)}")
        finally:
            # Clean up the temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
        
    def get_customer_id(self):
        """Get customer identifier - to be implemented by child classes"""
        raise NotImplementedError
        
    def has_network_diagram(self):
        """Check if network diagram was uploaded"""
        return 'network_diagram' in request.files and request.files['network_diagram'].filename
        
    def _draw_section_heading(self, y, title):
        """Helper to draw section headings with icons"""
        # Draw background for heading
        padding_vertical = 15
        height = 35
        radius = 10
        
        # Background color options (uncomment the one you want to use):
        # Option 1: Using RGB values (0-1)
        bg_color = colors.Color(0.96, 0.97, 0.98)  # Very light blue-gray
        # Option 2: Using HEX color
        # bg_color = colors.HexColor('#F5F7FA')
        # Option 3: Using predefined color
        # bg_color = colors.lightgrey
        
        # Draw rounded rectangle for heading background
        self.canvas.saveState()
        self.canvas.setFillColor(bg_color)
        self.canvas.roundRect(
            40,  # x
            y - height + padding_vertical + 5,
            self.width - 80,  # width
            height,  # height
            radius,  # radius
            fill=1,
            stroke=0
        )
        self.canvas.restoreState()
        
        self.canvas.setFont("Helvetica-Bold", 14)
        
        # Icon settings
        icon_size = 16
        text_x = 50
        icon_x = self.width - 70
        icon_y = y - 3
        
        # Draw title on the left
        self.canvas.drawString(text_x, y, title)
        
        # Set default icon path to None
        icon_path = None
        
        # Select icon based on section
        if title == "Infrastructure":
            icon_path = os.path.join("static", "cloud_icon.png")
        elif title == "Contacts":
            icon_path = os.path.join("static", "contact_icon.png")
        elif title == "Support":
            icon_path = os.path.join("static", "support_icon.png")
        elif title == "URLs":
            icon_path = os.path.join("static", "web_ui_icon.png")
        elif title == "Network/Architecture":
            icon_path = os.path.join("static", "network_diagram_icon.png")
            
        # Draw the icon if file exists and path is set
        if icon_path and os.path.exists(icon_path):
            self.canvas.drawImage(
                icon_path,
                icon_x,
                icon_y,
                width=icon_size,
                height=icon_size,
                preserveAspectRatio=True,
                mask='auto'
            )
            
        # Draw gradient line
        line_length = self.width - 100
        num_segments = 50
        segment_length = line_length / num_segments
        start_x = text_x
        
        # Gradient color options (uncomment the pair you want to use):
        # Option 1: Gray gradient (current)
        start_gray = 0.7  # Dark gray
        end_gray = 1.0    # White
        
        # Option 2: Blue gradient
        # start_color = colors.HexColor('#2C5282')  # Dark blue
        # end_color = colors.HexColor('#BEE3F8')  # Light blue
        
        # Option 3: Custom gradient
        # start_color = colors.HexColor('#2D3748')  # Dark slate
        # end_color = colors.HexColor('#EDF2F7')  # Light gray
        
        for i in range(num_segments):
            # Calculate gradient color
            progress = i / num_segments
            gray_value = start_gray + (end_gray - start_gray) * progress
            self.canvas.setStrokeColor(colors.Color(gray_value, gray_value, gray_value))
            self.canvas.line(
                start_x + (i * segment_length),
                y - 5,
                start_x + ((i + 1) * segment_length),
                y - 5
            )
        
        return y - 30

    def _draw_key_values(self, y, kv_pairs, section=None, draw=True):
        """Helper to draw key-value pairs with specific formatting per section"""
        label_x = 250  # Right-align position for labels
        value_x = 270  # Left-align position for values
        start_y = y  # Store initial y position
        
        if draw:
            # Draw the key-value pairs
            for key, value in kv_pairs:
                # Right-align the label in bold
                self.canvas.setFont("Helvetica-Bold", 10)
                self.canvas.drawRightString(label_x, y, key + ":")
                
                # Draw the value in regular font
                self.canvas.setFont("Helvetica", 10)
                
                # Make URLs clickable and blue for support section and URLs section
                if section == "support" or section == "urls":
                    value_str = str(value if value is not None else "")
                    if value_str.startswith(("http://", "https://")):
                        self.canvas.setFillColor(colors.HexColor('#0066cc'))
                        self.canvas.drawString(value_x, y, value_str)
                        self.canvas.linkURL(
                            value_str,
                            (value_x, y - 2, value_x + self.canvas.stringWidth(value_str, "Helvetica", 10), y + 10),
                            relative=False
                        )
                        self.canvas.setFillColor(colors.black)
                    else:
                        self.canvas.drawString(value_x, y, value_str)
                else:
                    self.canvas.drawString(value_x, y, str(value if value is not None else ""))
                
                y -= 20
        else:
            # Just calculate the height
            y -= 20 * len(kv_pairs)
            
        return y, start_y - y  # Return both new y position and section height
        
    def _draw_page_number(self, number):
        """Helper to draw page numbers"""
        self.canvas.setFont("Helvetica", 9)
        self.canvas.drawRightString(self.width - 40, 20, f"Page {number}")

    def _get_display_value(self, form_value):
        """Convert form values to display format by removing underscores and capitalizing"""
        if not form_value:
            return ""
            
        # Convert input to lowercase for consistent comparison
        form_value = str(form_value).lower()
            
        # Special case mappings
        special_cases = {
            "aws": "AWS",
            "azure": "Azure",
            "hybrid_dpe": "Hybrid DPE",
            "hybrid_dpe_with_privatelink": "Hybrid DPE with Privatelink",
            "ip_allowlisting": "IP Allowlisting",
            "vpn": "VPN",
            "privatelink": "PrivateLink"
        }
        
        # Check if it's a special case
        if form_value in special_cases:
            return special_cases[form_value]
            
        # Special handling for remaining connectivity values
        if form_value in ["public"]:
            return form_value.replace("_", " ").title()
            
        # Default handling for other values
        return " ".join(word.capitalize() for word in form_value.split("_"))

    def _get_infrastructure_fields(self):
        """Get infrastructure fields - to be implemented by child classes"""
        raise NotImplementedError

    def _generate_urls(self):
        """Generate URLs for Dedicated deployment"""
        customer_id = self.form_data.get("dedicated_customer_identifier", "").lower()
        if not customer_id:
            return []
            
        # Get selected environments and URLs
        environments = request.form.getlist("dedicated_environments")
        selected_urls = request.form.getlist("dedicated_urls[]")
        
        # Handle 'other' environment if specified
        other_env = request.form.get("dedicated_other_environment")
        if other_env and "other" in environments:
            environments.remove("other")
            environments.append(other_env)
            
        # URL patterns for each service
        url_mapping = {
            "one": ("ONE", lambda env: f"https://{customer_id}.{env}.ataccama.online"),
            "keycloak": ("Keycloak", lambda env: f"https://{customer_id}.{env}.ataccama.online/auth"),
            "dpm": ("DPM", lambda env: f"https://dpm.{customer_id}.{env}.ataccama.online"),
            "minio_console": ("MinIO Console", lambda env: f"https://minio-console.{customer_id}.{env}.ataccama.online"),
            "mdm_ui": ("MDM UI", lambda env: f"https://mdm.{customer_id}.{env}.ataccama.online"),
            "mdm_server": ("MDM Server", lambda env: f"https://mdm-server.{customer_id}.{env}.ataccama.online"),
            "rdm_ui": ("RDM UI", lambda env: f"https://rdm.{customer_id}.{env}.ataccama.online"),
            "rdm_server": ("RDM Server", lambda env: f"https://rdm-server.{customer_id}.{env}.ataccama.online"),
            "portal": ("Portal", lambda env: f"https://portal.{customer_id}.{env}.ataccama.online"),
            "datastories": ("Data Stories", lambda env: f"https://datastories.{customer_id}.{env}.ataccama.online")
        }
        
        urls = []
        # Generate URLs for each selected service in each environment
        for env in environments:
            env = env.lower()
            env_name = env.upper()
            urls.append(("", ""))  # Empty line before environment
            urls.append((f"Environment: {env_name}", ""))  # Environment header
            
            for url_key in selected_urls:
                if url_key in url_mapping:
                    label, url_generator = url_mapping[url_key]
                    urls.append((f"  {label}", url_generator(env)))
                    
        return urls

    def _draw_section_background(self, y, height):
        """Draw a section background with rounded corners"""
        padding = 20
        radius = 10
        bg_color = colors.Color(0.98, 0.98, 0.98)  # Even lighter gray
        
        self.canvas.saveState()
        # Move to back
        self.canvas.setFillColor(bg_color)
        self.canvas.roundRect(
            40,  # x
            y - height - padding,  # y
            self.width - 80,  # width
            height + (padding * 2),  # height
            radius,  # radius
            fill=1,
            stroke=0
        )
        self.canvas.restoreState()

    def _draw_page_footer(self, page_number):
        """Helper to draw page footer with page number and confidential mark"""
        self.canvas.saveState()
        self.canvas.setFont("Helvetica", 9)
        # Draw "Confidential" on the bottom left
        self.canvas.drawString(40, 20, "Confidential")
        # Draw page number on the bottom right
        self.canvas.drawRightString(self.width - 40, 20, f"Page {page_number}")
        self.canvas.restoreState()

class CloudPDFGenerator(BasePDFGenerator):
    def _generate_filename(self):
        return f"Ataccama Deployment Specification - {self.customer_name} - {self.today}.pdf"
        
    def get_customer_id(self):
        return self.form_data.get("cloud_region_identifier", "Unknown Region")
        
    def _get_infrastructure_fields(self):
        """Get Cloud-specific infrastructure fields"""
        cloud_vendor = self.form_data.get("cloud_vendor", "").lower()
        if cloud_vendor == "aws":
            cloud_vendor = "AWS"
        elif cloud_vendor == "azure":
            cloud_vendor = "Azure"
            
        return [
            ("Cloud Vendor", cloud_vendor),
            ("User Connectivity", self._get_display_value(self.form_data.get("cloud_user_connectivity"))),
            ("Data Source Connectivity", self._get_display_value(self.form_data.get("cloud_data_source_connectivity"))),
            ("SSO Vendor", self._get_sso_vendor()),
            ("Cloud Region", self.form_data.get("cloud_region")),
            ("Ataccama Version", self.form_data.get("cloud_ataccama_version")),
            ("Upgrade Stream", self.form_data.get("cloud_upgrade_stream")),
            ("Region Identifier", self.form_data.get("cloud_region_identifier"))
        ]
        
    def _get_sso_vendor(self):
        sso = self.form_data.get("cloud_sso_vendor")
        if sso == "Other":
            return self.form_data.get("cloud_sso_vendor_other")
        return sso

    def _generate_urls(self):
        """Generate URLs for Cloud deployment"""
        # Debug prints to understand what data we're getting
        print("Generating Cloud URLs")
        print("Form data:", self.form_data)
        
        region_id = self.form_data.get("cloud_region_identifier", "").lower()
        print(f"Region ID: {region_id}")
        
        if not region_id:
            print("No region ID found")
            return []

        # Get environment identifiers from form data
        env_identifiers = []
        try:
            num_envs = int(self.form_data.get("cloud_number_of_envs", "0"))
            print(f"Number of environments: {num_envs}")
            
            # Get environment data from form
            for i in range(num_envs):
                env_name_key = f"cloud_env_name_{i}"
                env_id_key = f"cloud_env_identifier_{i}"
                
                env_name = self.form_data.get(env_name_key)
                env_id = self.form_data.get(env_id_key)
                
                print(f"Looking for env {i}:")
                print(f"  Name key: {env_name_key} = {env_name}")
                print(f"  ID key: {env_id_key} = {env_id}")
                
                if env_id and env_name:
                    env_identifiers.append((env_name, env_id.lower()))
            
            print(f"Found environments: {env_identifiers}")
            
        except ValueError as e:
            print(f"Error parsing number of environments: {e}")
            return []

        # URL patterns for cloud services
        url_patterns = {
            "DQ": lambda env_id: f"https://one-{env_id}.worker-01-{region_id}.prod.ataccama.link/",
            "Keycloak": lambda env_id: f"https://one-{env_id}.worker-01-{region_id}.prod.ataccama.link/auth/",
            "Minio Console": lambda env_id: f"https://minio-console-one-{env_id}.worker-01-{region_id}.prod.ataccama.link/",
            "Audit": lambda env_id: f"https://one-{env_id}.worker-01-{region_id}.prod.ataccama.link/audit-operations",
            "DPM": lambda env_id: f"https://dpm-one-{env_id}.worker-01-{region_id}.prod.ataccama.link/jobs",
            "Orchestration Server": lambda env_id: f"https://runtime-server-one-{env_id}.worker-01-{region_id}.prod.ataccama.link/"
        }

        urls = []
        # Generate URLs for each environment
        for env_name, env_id in env_identifiers:
            print(f"Generating URLs for environment: {env_name} ({env_id})")
            urls.append(("", ""))  # Empty line before environment
            urls.append((f"Environment: {env_name.upper()}", ""))  # Environment header
            
            # Generate URLs for each service in this environment
            for service_name, url_generator in url_patterns.items():
                url = url_generator(env_id)
                print(f"  {service_name}: {url}")
                urls.append((f"  {service_name}", url))

        print(f"Generated {len(urls)} URL entries")
        return urls

class DedicatedPDFGenerator(BasePDFGenerator):
    def _generate_filename(self):
        return f"Ataccama Deployment Specification - {self.customer_name} - {self.today}.pdf"
        
    def get_customer_id(self):
        return self.form_data.get("dedicated_customer_identifier", "Unknown Customer")
        
    def _get_infrastructure_fields(self):
        """Get Dedicated-specific infrastructure fields"""
        cloud_vendor = self.form_data.get("dedicated_cloud_vendor", "").lower()
        if cloud_vendor == "aws":
            cloud_vendor = "AWS"
        elif cloud_vendor == "azure":
            cloud_vendor = "Azure"
            
        return [
            ("Cloud Vendor", cloud_vendor),
            ("User Connectivity", self._get_display_value(self.form_data.get("dedicated_user_connectivity"))),
            ("Data Source Connectivity", self._get_display_value(self.form_data.get("dedicated_data_source_connectivity"))),
            ("SSO Vendor", self._get_sso_vendor()),
            ("Cloud Region", self.form_data.get("dedicated_cloud_region")),
            ("Ataccama Version", self.form_data.get("dedicated_ataccama_version")),
            ("Customer Identifier", self.form_data.get("dedicated_customer_identifier"))
        ]
        
    def _get_sso_vendor(self):
        sso = self.form_data.get("dedicated_sso_vendor")
        if sso == "Other":
            return self.form_data.get("dedicated_sso_vendor_other")
        return sso

@app.route("/", methods=["GET"])
def index():
    """
    Main route handler for the web application.
    Handles both GET (form display) and POST (form submission) requests.
    """
    return render_template("index.html")

@app.route("/generate_pdf", methods=["POST"])
def generate_pdf():
    deployment_style = request.form.get("deployment_style")
    print("Form data received:", dict(request.form))  # Debug print
    
    # Choose the appropriate generator based on deployment style
    if deployment_style == "cloud":
        generator = CloudPDFGenerator(request.form)
    else:  # dedicated
        generator = DedicatedPDFGenerator(request.form)
    
    # Generate the PDF
    filepath = generator.generate()
    
    # Send the file
    return send_file(filepath, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=10000)
