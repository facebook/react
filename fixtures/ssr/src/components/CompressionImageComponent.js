const Image = ({
    src,
    alt,
    quality = 0.7,
    imageSize = false,
    height,
    width,
    edit = {},
    responsiveSrc = {},
    className,
    id,
    loading = false,
  }) => {
    const [webpSrc, setWebpSrc] = useState(null);
    const [compressedSize, setCompressedSize] = useState(null);
    const [placeholder, setPlaceholder] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
  
    useEffect(() => {
      const loadImage = async () => {
        const img = new window.Image();
        img.src = src;
  
        img.onload = () => {
          compressImage(img);
        };
  
        img.onerror = () => {
          setError(true);
        };
      };
  
      if (src) {
        loadImage();
      }
    }, [src]);
  
    const compressImage = (img) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
  
      canvas.width = width || img.width;
      canvas.height = height || img.height;
  
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
      const webpDataUrl = canvas.toDataURL("image/webp", quality);
  
      setWebpSrc(webpDataUrl);
      setPlaceholder(false);
  
      const webpSizeInBytes = Math.ceil((webpDataUrl.length * 3) / 4);
      const sizeInKB = (webpSizeInBytes / 1024).toFixed(2);
  
      setCompressedSize(sizeInKB);
    };
  
    return (
      <div>
        {placeholder && !error && (
          <div
            style={{
              height,
              width,
              backgroundColor: "#f0f0f0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "14px",
              color: "#999",
            }}
          >
            {loading ? "Loading..." : ""}
          </div>
        )}
  
        <picture>
          {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
          {responsiveSrc && (
            <source
              srcSet={responsiveSrc.srcSet}
              sizes={responsiveSrc.sizes}
              type="image/jpeg"
            />
          )}
  
          <img
            className={className}
            id={id}
            style={{
              filter: isLoaded ? "none" : "blur(10px)",
              transition: "filter 0.3s ease-in-out",
              ...edit,
            }}
            height={height}
            width={width}
            src={webpSrc || src}
            alt={alt}
            loading="lazy"
            aria-label={alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => setError(true)}
          />
        </picture>
  
        {imageSize && compressedSize && !error && (
          <p>
            Image Size: <span style={{ color: "blue" }}>{compressedSize} </span>{" "}
            KB
          </p>
        )}
  
        {error && <p style={{ color: "red" }}>Failed to load image</p>}
      </div>
    );
  };
export default Image